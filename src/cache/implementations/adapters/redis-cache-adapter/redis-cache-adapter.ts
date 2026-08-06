/**
 * @module Cache
 */

import { ReplyError } from "ioredis";

import { RedisCacheAdapterSerde } from "@/cache/implementations/adapters/redis-cache-adapter/redis-cache-adapter-serde.js";
import { ClearIterable } from "@/cache/implementations/adapters/redis-cache-adapter/utilities.js";

import type { Redis, Result } from "ioredis";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";
import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_cache_increment(
            key: string,
            number: string,
        ): Result<number, Context>;

        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_cache_get_or_add(
            key: string,
            value: string,
            ttlInMs: number,
        ): Result<string, Context>;
    }
}

/**
 * Configuration for `RedisCacheAdapter`.
 * Requires a Redis client and a serde for serialising cache values to strings.
 *
 * IMPORT_PATH: `"eridu-tech/cache/redis-cache-adapter"`
 * @group Adapters
 */
export type RedisCacheAdapterSettings = {
    /**
     * The Redis client instance for cache operations.
     */
    database: Redis;
    /**
     * Serde instance for serializing and deserializing cache values to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * To utilize the `RedisCacheAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package and supply a {@link ISerde | `ISerde`}, with adapter like {@link SuperJsonSerdeAdapter | `SuperJsonSerdeAdapter`}.
 *
 * IMPORT_PATH: `"eridu-tech/cache/redis-cache-adapter"`
 * @group Adapters
 */
export class RedisCacheAdapter<
    TType = unknown,
> implements ICacheAdapter<TType> {
    private static isRedisTypeError(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        value: any,
    ): boolean {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return (
            value instanceof ReplyError &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            value.message.includes("ERR value is not a valid float")
        );
    }

    private readonly serde: ISerde<string>;
    private readonly database: Redis;

    /**
     * @example
     * ```ts
     * import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     * import Redis from "ioredis";
     *
     * const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const cacheAdapter = new RedisCacheAdapter({
     *   database,
     *   serde,
     * });
     * ```
     */
    constructor(settings: RedisCacheAdapterSettings) {
        const { database, serde } = settings;
        this.database = database;
        this.serde = new RedisCacheAdapterSerde(serde);
        this.initIncrementCommand();
        this.initGetOrAddCommand();
    }

    private initGetOrAddCommand(): void {
        if (typeof this.database.eridu_cache_get_or_add === "function") {
            return;
        }

        this.database.defineCommand("eridu_cache_get_or_add", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1]
                local newValue = ARGV[1]
                local ttl = tonumber(ARGV[2])
                local existing = redis.call("get", key)
                if existing then
                    return existing
                end
                if ttl == -1 then
                    redis.call("set", key, newValue)
                else
                    redis.call("set", key, newValue, "PX", ttl)
                end
                return newValue
                `,
        });
    }

    async getOrAdd(
        key: string,
        valueToAdd: TType,
        ttl: TimeSpan | null,
        _context: IReadableContext,
    ): Promise<TType> {
        const serializedValue = this.serde.serialize(valueToAdd);
        const ttlInMs = ttl?.toMilliseconds() ?? -1;
        const result = await this.database.eridu_cache_get_or_add(
            key,
            serializedValue,
            ttlInMs,
        );
        return await this.serde.deserialize(result);
    }

    private initIncrementCommand(): void {
        if (typeof this.database.eridu_cache_increment === "function") {
            return;
        }

        this.database.defineCommand("eridu_cache_increment", {
            numberOfKeys: 1,
            lua: `
                local hasKey = redis.call("exists", KEYS[1])
        
                if hasKey == 1 then
                    redis.call("incrbyfloat", KEYS[1], tonumber(ARGV[1]))
                end
                
                return hasKey
                `,
        });
    }

    async get(key: string, _context: IReadableContext): Promise<TType | null> {
        const value = await this.database.get(key);
        if (value === null) {
            return null;
        }
        return await this.serde.deserialize(value);
    }

    async getAndRemove(
        key: string,
        _context: IReadableContext,
    ): Promise<TType | null> {
        const value = await this.database.getdel(key);
        if (value === null) {
            return null;
        }
        return this.serde.deserialize(value);
    }

    async add(
        key: string,
        value: TType,
        ttl: TimeSpan | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (ttl === null) {
            const result = await this.database.set(
                key,
                this.serde.serialize(value),
                "NX",
            );
            return result === "OK";
        }
        const result = await this.database.set(
            key,
            this.serde.serialize(value),
            "PX",
            ttl.toMilliseconds(),
            "NX",
        );
        return result === "OK";
    }

    async put(
        key: string,
        value: TType,
        ttl: TimeSpan | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        if (ttl === null) {
            const result = await this.database.set(
                key,
                this.serde.serialize(value),
                "GET",
            );
            return result !== null;
        }
        const result = await this.database.set(
            key,
            this.serde.serialize(value),
            "PX",
            ttl.toMilliseconds(),
            "GET",
        );
        return result !== null;
    }

    async update(
        key: string,
        value: TType,
        _context: IReadableContext,
    ): Promise<boolean> {
        const result = await this.database.set(
            key,
            this.serde.serialize(value),
            "XX",
        );
        return result === "OK";
    }

    async increment(
        key: string,
        value: number,
        _context: IReadableContext,
    ): Promise<boolean> {
        try {
            const redisResult = await this.database.eridu_cache_increment(
                key,
                this.serde.serialize(value),
            );
            const keyExists = redisResult === 1;
            return keyExists;
        } catch (error: unknown) {
            if (!RedisCacheAdapter.isRedisTypeError(error)) {
                throw error;
            }
            throw new TypeError(
                `Unable to increment or decrement none number type key "${key}"`,
            );
        }
    }

    async removeMany(
        keys: Array<string>,
        _context: IReadableContext,
    ): Promise<boolean> {
        const deleteResult = await this.database.del(...keys);
        return deleteResult > 0;
    }

    async removeAll(_context: IReadableContext): Promise<void> {
        await this.database.flushdb();
    }

    async removeByKeyPrefix(
        prefix: string,
        _context: IReadableContext,
    ): Promise<void> {
        for await (const _ of new ClearIterable(this.database, prefix)) {
            /* Empty */
        }
    }
}

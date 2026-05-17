/**
 * @module Lock
 */

import { type Result, type Redis } from "ioredis";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ILockAdapter,
    type ILockAdapterState,
} from "@/lock/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * @internal
 */
type IRedisJsonLockState = {
    owner: string;
    expiration: number;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        /**
         *
         * @param key
         * @param lockId
         * @param expiration As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        daiso_lock_acquire(
            key: string,
            lockId: string,
            expiration: number | null,
        ): Result<1 | 0, Context>;

        // eslint-disable-next-line @typescript-eslint/naming-convention
        daiso_lock_release(key: string, lockId: string): Result<1 | 0, Context>;

        /**
         *
         * @param key
         * @param lockId
         * @param expiration As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        daiso_lock_refresh(
            key: string,
            lockId: string,
            expiration: number,
        ): Result<1 | 0, Context>;

        /**
         * @returns {string} {@link IRedisJsonLockState | `IRedisJsonLockState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        daiso_lock_get_state(key: string): Result<string, Context>;
    }
}

/**
 * To utilize the `RedisLockAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package.
 *
 * Note in order to use `RedisLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/redis-lock-adapter"`
 * @group Adapters
 */
export class RedisLockAdapter implements ILockAdapter {
    /**
     * @example
     * ```ts
     * import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
     * import Redis from "ioredis";
     *
     * const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
     * const lockAdapter = new RedisLockAdapter(database);
     * ```
     */
    constructor(private readonly database: Redis) {
        this.initAquireCommand();
        this.initReleaseCommand();
        this.initRefreshComand();
        this.initGetStateComand();
    }

    private initAquireCommand(): void {
        if (typeof this.database.daiso_lock_acquire === "function") {
            return;
        }
        this.database.defineCommand("daiso_lock_acquire", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local lockId = ARGV[1];

                -- Expiration time as unix timestamp in ms
                local expiration = tonumber(ARGV[2]);

                if redis.call("exists", key) == 1 then
                    return redis.call("get", key) == lockId;
                end
                
                if expiration == nil then
                    redis.call("set", key, lockId, "nx");
                else
                    redis.call("set", key, lockId, "pxat", expiration, "nx");
                end
                
                return 1;
            `,
        });
    }

    private initReleaseCommand(): void {
        if (typeof this.database.daiso_lock_release === "function") {
            return;
        }

        this.database.defineCommand("daiso_lock_release", {
            numberOfKeys: 1,
            lua: `
                local key = KEYS[1];
                local lockId = ARGV[1];

                if redis.call("exists", key) == 0 then
                    return 0
                end

                local isNotCurrentOwner = redis.call("get", key) ~= lockId
                if isNotCurrentOwner then
                    return 0
                end

                redis.call("del", key)
                
                return 1
            `,
        });
    }

    private initRefreshComand(): void {
        if (typeof this.database.daiso_lock_refresh === "function") {
            return;
        }

        this.database.defineCommand("daiso_lock_refresh", {
            numberOfKeys: 1,
            lua: `
                -- Arguments
                local key = KEYS[1];
                local lockId = ARGV[1];

                -- Expiration time as unix timestamp in ms
                local expiration = tonumber(ARGV[2]);

                if redis.call("exists", key) == 0 then
                    return 0
                end
                
                local isNotCurrentOwner = redis.call("get", key) ~= lockId
                if redis.call("get", key) ~= lockId then
                    return 0
                end

                local currentExpiration = redis.call("pttl", key)
                local isUnexpireable = currentExpiration == -1
                if isUnexpireable then
                    return 0
                end

                redis.call("pexpireat", key, expiration)
                return 1
            `,
        });
    }

    private initGetStateComand(): void {
        if (typeof this.database.daiso_lock_get_state === "function") {
            return;
        }

        this.database.defineCommand("daiso_lock_get_state", {
            numberOfKeys: 1,
            lua: `
                -- Arguments
                local key = KEYS[1];

                if tonumber(redis.call("exists", key)) == 0 then
                    return cjson.encode(nil);
                end

                local state = {
                    owner = redis.call("get", key),
                    expiration = tonumber(redis.call("pexpiretime", key))
                };

                return cjson.encode(state); 
            `,
        });
    }

    async acquire(
        _context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean> {
        const result = await this.database.daiso_lock_acquire(
            key,
            lockId,
            ttl?.toEndDate().getTime() ?? null,
        );
        return result === 1;
    }

    async release(
        _context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean> {
        const result = await this.database.daiso_lock_release(key, lockId);
        return result === 1;
    }

    async forceRelease(
        _context: IReadableContext,
        key: string,
    ): Promise<boolean> {
        const result = await this.database.del(key);
        return result > 0;
    }

    async refresh(
        _context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean> {
        const result = await this.database.daiso_lock_refresh(
            key,
            lockId,
            ttl.toEndDate().getTime(),
        );
        return result === 1;
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<ILockAdapterState | null> {
        const json = JSON.parse(
            await this.database.daiso_lock_get_state(key),
        ) as IRedisJsonLockState | null;
        if (json === null) {
            return null;
        }
        return {
            owner: json.owner,
            expiration:
                json.expiration === -1 ? null : new Date(json.expiration),
        };
    }
}

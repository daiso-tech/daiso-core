/**
 * @module Cache
 */

import {
    KeyNotFoundCacheError,
    KeyExistsCacheError,
} from "@/cache/contracts/_module.js";
import { withCacheSchema } from "@/cache/implementations/derivables/cache/with-cache-schema.js";
import { withPlugin } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    isInvocable,
    resolveAsyncLazyable,
    resolveInvocable,
} from "@/utilities/_module.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ICache, ICacheAdapter } from "@/cache/contracts/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";
import type { AsyncLazyable, NoneFunc } from "@/utilities/_module.js";

/**
 * Base configuration shared by all `Cache` variants.
 * Provides optional schema validation for all cached values.
 *
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export type CacheSettingsBase<TType = unknown> = {
    /**
     * You can decide the default ttl value. If null is passed then no ttl will be used by default.
     * @default null
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * A standard-schema-compliant schema used to validate cache values.
     * Compatible with libraries such as Zod, ArkType, Valibot, and others
     * that implement the `StandardSchemaV1` specification.
     */
    schema?: StandardSchemaV1<TType>;

    /**
     * Whether to validate values returned by `get` and `getAndRemove`
     * on retrieval, in addition to validating values on write.
     * When `true`, malformed data in the cache is caught at read time
     * rather than silently returned.
     *
     * @default true
     */
    shouldValidateOutput?: boolean;
};

/**
 * Configuration for the `Cache` class.
 * Extends {@link CacheSettingsBase | `CacheSettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export type CacheSettings<TType = unknown> = CacheSettingsBase<TType> & {
    /**
     * The underlying cache adapter that handles the actual storage operations.
     */
    adapter: ICacheAdapter<any>;
};

/**
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export class Cache<TType = unknown> implements ICache<TType> {
    private readonly adapter: ICacheAdapter<TType>;
    private readonly defaultTtl: TimeSpan | null;

    /**
     *
     * @example
     * ```ts
     * import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     * import Sqlite from "better-sqlite3";
     * import { Cache } from "eridu-tech/cache";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const database = new Sqlite("local.db");
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const cacheAdapter = new KyselyCacheAdapter({
     *   kysely: new Kysely({
     *     dialect: new SqliteDialect({
     *       database,
     *     }),
     *   }),
     *   serde,
     * });
     * // You need initialize the adapter once before using it.
     * await cacheAdapter.init();
     *
     * const cache = new Cache({
     *   adapter: cacheAdapter,
     * });
     * ```
     */
    constructor(settings: CacheSettings<TType>) {
        const {
            adapter,
            defaultTtl = null,
            schema,
            shouldValidateOutput,
        } = settings;

        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);

        this.adapter = adapter;
        if (schema) {
            this.adapter = withPlugin(
                adapter,
                withCacheSchema({
                    schema,
                    shouldValidateOutput,
                }),
            );
        }
    }

    async exists(key: string): Promise<boolean> {
        const value = await this.get(key);
        return value !== null;
    }

    async missing(key: string): Promise<boolean> {
        const hasKey = await this.exists(key);
        return !hasKey;
    }

    async get(key: string): Promise<TType | null> {
        return await this.adapter.get(key);
    }

    async getOrFail(key: string): Promise<TType> {
        const value = await this.get(key);
        if (value === null) {
            throw KeyNotFoundCacheError.create(key);
        }
        return value;
    }

    async getAndRemove(key: string): Promise<TType | null> {
        return await this.adapter.getAndRemove(key);
    }

    async getOr(
        key: string,
        defaultValue: AsyncLazyable<NoneFunc<TType>>,
    ): Promise<TType> {
        const value = await this.get(key);
        if (value === null) {
            const simplifiedValueToAdd =
                await resolveAsyncLazyable(defaultValue);
            return simplifiedValueToAdd;
        }
        return value;
    }

    async getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<TType>,
        ttl: ITimeSpan | null = this.defaultTtl,
    ): Promise<TType> {
        return await this.adapter.getOrAdd(
            key,
            isInvocable(valueToAdd) ? resolveInvocable(valueToAdd) : valueToAdd,
            ttl === null ? null : TimeSpan.fromTimeSpan(ttl).toEndDate(),
        );
    }

    async add(
        key: string,
        value: TType,
        ttl: ITimeSpan | null = this.defaultTtl,
    ): Promise<boolean> {
        const hasAdded = await this.adapter.add(
            key,
            value,
            ttl === null ? null : TimeSpan.fromTimeSpan(ttl).toEndDate(),
        );

        return hasAdded;
    }

    async addOrFail(
        key: string,
        value: TType,
        ttl: ITimeSpan | null = this.defaultTtl,
    ): Promise<void> {
        const isNotFound = await this.add(key, value, ttl);
        if (!isNotFound) {
            throw KeyExistsCacheError.create(key);
        }
    }

    async put(
        key: string,
        value: TType,
        ttl: ITimeSpan | null = this.defaultTtl,
    ): Promise<boolean> {
        const hasUpdated = await this.adapter.put(
            key,
            value,
            ttl === null ? null : TimeSpan.fromTimeSpan(ttl).toEndDate(),
        );
        return hasUpdated;
    }

    async update(key: string, value: TType): Promise<boolean> {
        const hasUpdated = await this.adapter.update(key, value);

        return hasUpdated;
    }

    async updateOrFail(key: string, value: TType): Promise<void> {
        const isFound = await this.update(key, value);
        if (!isFound) {
            throw KeyNotFoundCacheError.create(key);
        }
    }

    async increment(
        key: string,
        value = 1 as Extract<TType, number>,
    ): Promise<boolean> {
        const hasUpdated = await this.adapter.increment(key, value);

        return hasUpdated;
    }

    async incrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        const isFound = await this.increment(key, value);
        if (!isFound) {
            throw KeyNotFoundCacheError.create(key);
        }
    }

    async decrement(
        key: string,
        value = 1 as Extract<TType, number>,
    ): Promise<boolean> {
        return await this.increment(key, -value as Extract<TType, number>);
    }

    async decrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        const isFound = await this.decrement(key, value);
        if (!isFound) {
            throw KeyNotFoundCacheError.create(key);
        }
    }

    async remove(key: string): Promise<boolean> {
        const hasRemoved = await this.adapter.removeMany([key]);

        return hasRemoved;
    }

    async removeOrFail(key: string): Promise<void> {
        const isFound = await this.remove(key);
        if (!isFound) {
            throw KeyNotFoundCacheError.create(key);
        }
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        const keysArr = [...keys];
        if (keysArr.length === 0) {
            return true;
        }
        const hasRemovedAtLeastOne = await this.adapter.removeMany(keys);
        return hasRemovedAtLeastOne;
    }

    async clear(): Promise<void> {
        await this.adapter.removeByPrefix("");
    }
}

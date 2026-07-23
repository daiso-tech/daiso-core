/**
 * @module Cache
 */

import {
    type ICache,
    type ICacheAdapter,
    KeyNotFoundCacheError,
    KeyExistsCacheError,
} from "@/cache/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    resolveAsyncLazyable,
    type AsyncLazyable,
    type NoneFunc,
} from "@/utilities/_module.js";

/**
 * Base configuration shared by all `Cache` variants.
 * Provides optional schema validation for all cached values.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export type CacheSettingsBase = {
    /**
     * You can decide the default ttl value. If null is passed then no ttl will be used by default.
     * @default null
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * You can pass {@link IReadableContext | `IReadableContext`} that will be used by context-aware adapters.
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
};

/**
 * Configuration for the `Cache` class.
 * Extends {@link CacheSettingsBase | `CacheSettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export type CacheSettings = CacheSettingsBase & {
    /**
     * The underlying cache adapter that handles the actual storage operations.
     */
    adapter: ICacheAdapter<any>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export class Cache<TType = unknown> implements ICache<TType> {
    private readonly adapter: ICacheAdapter<TType>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly context: IReadableContext;

    /**
     *
     * @example
     * ```ts
     * import { KyselyCacheAdapter } from "@daiso-tech/core/cache/kysely-cache-adapter";
     * import { Serde } from "@daiso-tech/core/serde";
     * import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter"
     * import Sqlite from "better-sqlite3";
     * import { Cache } from "@daiso-tech/core/cache";
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
    constructor(settings: CacheSettings) {
        const {
            adapter,
            defaultTtl = null,
            context = new ExecutionContext(new NoOpExecutionContextAdapter()),
        } = settings;

        this.context = context;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.adapter = adapter;
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
        return await this.adapter.get(this.context, key);
    }

    async getOrFail(key: string): Promise<TType> {
        const value = await this.get(key);
        if (value === null) {
            throw KeyNotFoundCacheError.create(key);
        }
        return value;
    }

    async getAndRemove(key: string): Promise<TType | null> {
        return await this.adapter.getAndRemove(this.context, key);
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
        valueToAdd: TType,
        ttl: ITimeSpan | null = this.defaultTtl,
    ): Promise<TType> {
        return await this.adapter.getOrAdd(
            this.context,
            key,
            valueToAdd,
            ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
        );
    }

    async add(
        key: string,
        value: TType,
        ttl: ITimeSpan | null = this.defaultTtl,
    ): Promise<boolean> {
        const hasAdded = await this.adapter.add(
            this.context,
            key,
            value,
            ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
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
            this.context,
            key,
            value,
            ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
        );
        return hasUpdated;
    }

    async update(key: string, value: TType): Promise<boolean> {
        const hasUpdated = await this.adapter.update(this.context, key, value);

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
        const hasUpdated = await this.adapter.increment(
            this.context,
            key,
            value,
        );

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
        const hasRemoved = await this.adapter.removeMany(this.context, [key]);

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
        const hasRemovedAtLeastOne = await this.adapter.removeMany(
            this.context,
            keys,
        );
        return hasRemovedAtLeastOne;
    }

    async clear(): Promise<void> {
        await this.adapter.removeByKeyPrefix(this.context, "");
    }
}

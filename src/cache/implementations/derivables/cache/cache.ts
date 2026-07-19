/**
 * @module Cache
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type ICache,
    type ICacheAdapter,
    KeyNotFoundCacheError,
    KeyExistsCacheError,
    type CacheWriteSettings,
    type GetOrAddSettings,
} from "@/cache/contracts/_module.js";
import { type CacheAdapterVariants } from "@/cache/contracts/types.js";
import { resolveCacheAdapter } from "@/cache/implementations/derivables/cache/resolve-cache-adapter.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type ILockFactory,
    type LockFactoryInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ILockAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IDatabaseLockAdapter,
} from "@/lock/contracts/_module.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type LockFactory,
    resolveLockFactoryInput,
} from "@/lock/implementations/derivables/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    resolveAsyncLazyable,
    validate,
    withJitter,
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
export type CacheSettingsBase<TType = unknown> = {
    /**
     * You can provide any [standard schema](https://standardschema.dev/) compliant object to validate all input and output data to ensure runtime type safety.
     */
    schema?: StandardSchemaV1<TType>;

    /**
     * You can enable validating cache values when retrieving them.
     * @default true
     */
    shouldValidateOutput?: boolean;

    /**
     * You can decide the default ttl value. If null is passed then no ttl will be used by default.
     * @default null
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * You can pass jitter value to ensure the backoff will not execute at the same time.
     * If you pas null you can disable the jitrter.
     * @default 0.2
     */
    defaultJitter?: number | null;

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

    /**
     * You can provide an {@link ILockFactoryBase | `ILockFactoryBase`}, an {@link ILockAdapter | `ILockAdapter`} or an {@link IDatabaseLockAdapter | `IDatabaseLockAdapter`} instance to handle locking when {@link GetOrAddSettings | `GetOrAddSettings.enableLocking`} is set to true during a `getOrAdd` call.
     * If you provide an adapter, it will be automatically wrapped in an {@link LockFactory | `LockFactory`} instance.
     * @default
     * ```ts
     * import { NoOpLockAdapter } from "@daiso-tech/core/lock/no-op-lock-adapter";
     *
     * new NoOpLockAdapter()
     * ```
     */
    lockFactory?: LockFactoryInput;
};

/**
 * Configuration for the `Cache` class.
 * Extends {@link CacheSettingsBase | `CacheSettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export type CacheSettings<TType = unknown> = CacheSettingsBase<TType> & {
    /**
     * The underlying cache adapter that handles the actual storage operations.
     */
    adapter: CacheAdapterVariants<any>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export class Cache<TType = unknown> implements ICache<TType> {
    private readonly adapter: ICacheAdapter<TType>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly schema: StandardSchemaV1<TType> | undefined;
    private readonly shouldValidateOutput: boolean;
    private readonly defaultJitter: number | null;
    private readonly context: IReadableContext;
    private readonly lockFactory: ILockFactory;

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
    constructor(settings: CacheSettings<TType>) {
        const {
            shouldValidateOutput = true,
            schema,
            adapter,
            defaultTtl = null,
            defaultJitter = 0.2,
            context = new ExecutionContext(new NoOpExecutionContextAdapter()),
            lockFactory = new NoOpLockAdapter(),
        } = settings;

        this.lockFactory = resolveLockFactoryInput(lockFactory);
        this.context = context;
        this.shouldValidateOutput = shouldValidateOutput;
        this.schema = schema;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.adapter = resolveCacheAdapter(adapter);
        this.defaultJitter = defaultJitter;
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
        let value = await this.adapter.get(this.context, key);
        if (
            this.shouldValidateOutput &&
            this.schema !== undefined &&
            value !== null
        ) {
            value = await validate(this.schema, value);
        }

        return value;
    }

    async getOrFail(key: string): Promise<TType> {
        const value = await this.get(key);
        if (value === null) {
            throw KeyNotFoundCacheError.create(key);
        }
        return value;
    }

    async getAndRemove(key: string): Promise<TType | null> {
        let value = await this.adapter.getAndRemove(this.context, key);
        if (
            this.shouldValidateOutput &&
            this.schema !== undefined &&
            value !== null
        ) {
            value = await validate(this.schema, value);
        }

        return value;
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

    private async _getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<NoneFunc<TType>>,
        settings?: GetOrAddSettings,
    ): Promise<TType> {
        const ttl = this.resolveCacheWriteSettings(settings);

        let value = await this.adapter.get(this.context, key);
        if (
            this.shouldValidateOutput &&
            this.schema !== undefined &&
            value !== null
        ) {
            value = await validate(this.schema, value);
        }
        if (value === null) {
            let resolvedValueToAdd = await resolveAsyncLazyable(valueToAdd);
            if (this.schema !== undefined) {
                resolvedValueToAdd = (await validate(
                    this.schema,
                    resolvedValueToAdd,
                )) as NoneFunc<TType>;
            }
            await this.adapter.add(this.context, key, resolvedValueToAdd, ttl);
            return resolvedValueToAdd;
        }

        return value;
    }

    async getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<NoneFunc<TType>>,
        settings?: GetOrAddSettings,
    ): Promise<TType> {
        const enableLocking = settings?.enableLocking ?? false;

        if (enableLocking) {
            return await this.lockFactory.create(key).runOrFail(async () => {
                return await this._getOrAdd(key, valueToAdd, settings);
            });
        }
        return await this._getOrAdd(key, valueToAdd, settings);
    }

    private resolveCacheWriteSettings(
        settings: CacheWriteSettings = {},
    ): TimeSpan | null {
        const {
            ttl = this.defaultTtl,
            jitter = this.defaultJitter,
            _mathRandom = Math.random,
        } = settings;
        if (ttl === null) {
            return null;
        }

        const ttlAsTimeSpan = TimeSpan.fromTimeSpan(ttl);
        if (jitter === null) {
            return ttlAsTimeSpan;
        }

        return TimeSpan.fromMilliseconds(
            withJitter({
                jitter,
                randomValue: _mathRandom(),
                value: ttlAsTimeSpan.toMilliseconds(),
            }),
        );
    }

    async add(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<boolean> {
        const ttl = this.resolveCacheWriteSettings(settings);

        if (this.schema !== undefined) {
            value = await validate(this.schema, value);
        }
        const hasAdded = await this.adapter.add(this.context, key, value, ttl);

        return hasAdded;
    }

    async addOrFail(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<void> {
        const isNotFound = await this.add(key, value, settings);
        if (!isNotFound) {
            throw KeyExistsCacheError.create(key);
        }
    }

    async put(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<boolean> {
        const ttl = this.resolveCacheWriteSettings(settings);

        if (this.schema !== undefined) {
            value = await validate(this.schema, value);
        }
        const hasUpdated = await this.adapter.put(
            this.context,
            key,
            value,
            ttl,
        );
        return hasUpdated;
    }

    async update(key: string, value: TType): Promise<boolean> {
        if (this.schema !== undefined) {
            value = await validate(this.schema, value);
        }
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

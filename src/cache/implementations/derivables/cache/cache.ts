/**
 * @module Cache
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    CACHE_EVENTS,
    type ICache,
    type ICacheAdapter,
    KeyNotFoundCacheError,
    type CacheEventMap,
    type NotFoundCacheEvent,
    type RemovedCacheEvent,
    KeyExistsCacheError,
    type CacheWriteSettings,
    type ICacheListenable,
    type GetOrAddSettings,
} from "@/cache/contracts/_module.js";
import { type CacheAdapterVariants } from "@/cache/contracts/types.js";
import { resolveCacheAdapter } from "@/cache/implementations/derivables/cache/resolve-cache-adapter.js";
import {
    type EventBusInput,
    type IEventBus,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IEventBusAdapter,
} from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import {
    resolveEventBusInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type EventBus,
} from "@/event-bus/implementations/derivables/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type ILockFactoryBase,
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
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callInvokable,
    defaultWaitUntil,
    resolveAsyncLazyable,
    validate,
    withJitter,
    type AsyncLazyable,
    type NoneFunc,
    type WaitUntil,
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
     * @default
     * ```ts
     * import { NoOpNamespace } from "@daiso-tech/core/namespace";
     *
     * new NoOpNamespace()
     * ```
     */
    namespace?: INamespace;

    /**
     * You can provide an {@link IEventBus | `IEventBus`} or an {@link IEventBusAdapter | `IEventBusAdapter`} instance to handle the component's events.
     * If you provide an adapter, it will be automatically wrapped in an {@link EventBus | `EventBus`} instance.
     *
     * @default
     * ```ts
     * import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";
     *
     * new NoOpEventBusAdapter()
     * ```
     */
    eventBus?: EventBusInput;

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
     * You can pass the `waitUntil` function to handle background promises.
     * This is required when working with environments like Cloudflare Workers or Vercel Functions to ensure tasks complete after the response is sent.
     * @default
     * ```ts
     * import { defaultWaitUntil } from "@daiso-tech/core/utilities"
     * ```
     */
    waitUntil?: WaitUntil;

    /**
     * You can pass {@link IExecutionContext | `IExecutionContext`} that will be used by context-aware adapters.
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    executionContext?: IExecutionContext;

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
    private readonly eventBus: IEventBus<CacheEventMap<TType>>;
    private readonly adapter: ICacheAdapter<TType>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly namespace: INamespace;
    private readonly schema: StandardSchemaV1<TType> | undefined;
    private readonly shouldValidateOutput: boolean;
    private readonly defaultJitter: number | null;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;
    private readonly lockFactory: ILockFactoryBase;

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
            namespace = new NoOpNamespace(),
            adapter,
            eventBus = new NoOpEventBusAdapter(),
            defaultTtl = null,
            defaultJitter = 0.2,
            waitUntil = defaultWaitUntil,
            executionContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
            lockFactory = new NoOpLockAdapter(),
        } = settings;

        this.lockFactory = resolveLockFactoryInput(namespace, lockFactory);
        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.shouldValidateOutput = shouldValidateOutput;
        this.schema = schema;
        this.namespace = namespace;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.eventBus = resolveEventBusInput(namespace, eventBus);
        this.adapter = resolveCacheAdapter(adapter);
        this.defaultJitter = defaultJitter;
    }

    get events(): ICacheListenable<TType> {
        return this.eventBus;
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
        const keyObj = this.namespace.create(key);
        try {
            const value = await this.adapter.get(
                this.executionContext,
                keyObj.toString(),
            );
            if (this.shouldValidateOutput && value !== null) {
                await validate(this.schema, value);
            }

            if (value === null) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.NOT_FOUND, {
                        key: keyObj,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.FOUND, {
                        key: keyObj,
                        value,
                    }),
                );
            }

            return value;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: [keyObj.get()],
                    method: this.get.name,
                    error,
                }),
            );
            throw error;
        }
    }

    async getOrFail(key: string): Promise<TType> {
        const value = await this.get(key);
        if (value === null) {
            throw KeyNotFoundCacheError.create(this.namespace.create(key));
        }
        return value;
    }

    async getAndRemove(key: string): Promise<TType | null> {
        const keyObj = this.namespace.create(key);
        try {
            const value = await this.adapter.getAndRemove(
                this.executionContext,
                keyObj.toString(),
            );
            if (this.shouldValidateOutput && value !== null) {
                await validate(this.schema, value);
            }

            if (value === null) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.NOT_FOUND, {
                        key: keyObj,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.REMOVED, {
                        key: keyObj,
                    }),
                );
            }
            return value;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: [keyObj.get()],
                    method: this.getAndRemove.name,
                    error,
                }),
            );
            throw error;
        }
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
        const keyObj = this.namespace.create(key);
        const value = await this.adapter.get(
            this.executionContext,
            keyObj.toString(),
        );
        if (this.shouldValidateOutput && value !== null) {
            await validate(this.schema, value);
        }
        if (value === null) {
            const resolvedValueToAdd = await resolveAsyncLazyable(valueToAdd);
            await validate(this.schema, resolvedValueToAdd);
            const hasAdded = await this.adapter.add(
                this.executionContext,
                keyObj.toString(),
                resolvedValueToAdd,
                ttl,
            );
            if (hasAdded) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.ADDED, {
                        key: keyObj,
                        value: resolvedValueToAdd,
                        ttl,
                    }),
                );
            }
            return resolvedValueToAdd;
        } else {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.FOUND, {
                    key: keyObj,
                    value,
                }),
            );
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
        const keyObj = this.namespace.create(key);
        try {
            await validate(this.schema, value);
            const hasAdded = await this.adapter.add(
                this.executionContext,
                keyObj.toString(),
                value,
                ttl,
            );
            if (hasAdded) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.ADDED, {
                        key: keyObj,
                        value,
                        ttl,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.KEY_EXISTS, {
                        key: keyObj,
                    }),
                );
            }
            return hasAdded;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: [keyObj.get()],
                    value,
                    method: this.add.name,
                    error,
                }),
            );
            throw error;
        }
    }

    async addOrFail(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<void> {
        const isNotFound = await this.add(key, value, settings);
        if (!isNotFound) {
            throw KeyExistsCacheError.create(this.namespace.create(key));
        }
    }

    async put(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<boolean> {
        const ttl = this.resolveCacheWriteSettings(settings);
        const keyObj = this.namespace.create(key);
        try {
            await validate(this.schema, value);
            const hasUpdated = await this.adapter.put(
                this.executionContext,
                keyObj.toString(),
                value,
                ttl,
            );
            if (hasUpdated) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.UPDATED, {
                        key: keyObj,
                        value,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.ADDED, {
                        key: keyObj,
                        value,
                        ttl,
                    }),
                );
            }
            return hasUpdated;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: [keyObj.get()],
                    value,
                    method: this.put.name,
                    error,
                }),
            );
            throw error;
        }
    }

    async update(key: string, value: TType): Promise<boolean> {
        const keyObj = this.namespace.create(key);
        try {
            await validate(this.schema, value);
            const hasUpdated = await this.adapter.update(
                this.executionContext,
                keyObj.toString(),
                value,
            );
            if (hasUpdated) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.UPDATED, {
                        key: keyObj,
                        value,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.NOT_FOUND, {
                        key: keyObj,
                    }),
                );
            }
            return hasUpdated;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: [keyObj.get()],
                    value,
                    method: this.update.name,
                    error,
                }),
            );
            throw error;
        }
    }

    async updateOrFail(key: string, value: TType): Promise<void> {
        const isFound = await this.update(key, value);
        if (!isFound) {
            throw KeyNotFoundCacheError.create(this.namespace.create(key));
        }
    }

    async increment(
        key: string,
        value = 1 as Extract<TType, number>,
    ): Promise<boolean> {
        const keyObj = this.namespace.create(key);
        try {
            const hasUpdated = await this.adapter.increment(
                this.executionContext,
                keyObj.toString(),
                value,
            );
            if (hasUpdated && value > 0) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.INCREMENTED, {
                        key: keyObj,
                        value,
                    }),
                );
            }
            if (hasUpdated && value < 0) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.DECREMENTED, {
                        key: keyObj,
                        value: -value,
                    }),
                );
            }
            if (!hasUpdated) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.NOT_FOUND, {
                        key: keyObj,
                    }),
                );
            }
            return hasUpdated;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: [keyObj.get()],
                    value,
                    method: this.increment.name,
                    error,
                }),
            );
            throw new TypeError(
                `Unable to increment or decrement none number type key "${keyObj.get()}"`,
                { cause: error },
            );
        }
    }

    async incrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        const isFound = await this.increment(key, value);
        if (!isFound) {
            throw KeyNotFoundCacheError.create(this.namespace.create(key));
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
            throw KeyNotFoundCacheError.create(this.namespace.create(key));
        }
    }

    async remove(key: string): Promise<boolean> {
        const keyObj = this.namespace.create(key);
        try {
            const hasRemoved = await this.adapter.removeMany(
                this.executionContext,
                [keyObj.toString()],
            );
            if (hasRemoved) {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.REMOVED, {
                        key: keyObj,
                    }),
                );
            } else {
                callInvokable(
                    this.waitUntil,
                    this.eventBus.dispatch(CACHE_EVENTS.NOT_FOUND, {
                        key: keyObj,
                    }),
                );
            }
            return hasRemoved;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: [keyObj.get()],
                    method: this.removeMany.name,
                    error,
                }),
            );
            throw error;
        }
    }

    async removeOrFail(key: string): Promise<void> {
        const isFound = await this.remove(key);
        if (!isFound) {
            throw KeyNotFoundCacheError.create(this.namespace.create(key));
        }
    }

    async removeMany(keys: Iterable<string>): Promise<boolean> {
        if (typeof keys === "string") {
            throw new TypeError(
                `You cannot pass a string as keys to "removeMany" method.`,
            );
        }
        const keysArr = [...keys];
        if (keysArr.length === 0) {
            return true;
        }
        const keyObjArr = keysArr.map((key) => this.namespace.create(key));
        try {
            const hasRemovedAtLeastOne = await this.adapter.removeMany(
                this.executionContext,
                keyObjArr.map((keyObj) => keyObj.toString()),
            );
            if (hasRemovedAtLeastOne) {
                const events = keyObjArr.map(
                    (
                        keyObj,
                    ): [typeof CACHE_EVENTS.REMOVED, RemovedCacheEvent] =>
                        [
                            CACHE_EVENTS.REMOVED,
                            {
                                key: keyObj,
                            },
                        ] as const,
                );
                for (const [eventName, event] of events) {
                    callInvokable(
                        this.waitUntil,
                        this.eventBus.dispatch(eventName, event),
                    );
                }
            } else {
                const events = keyObjArr.map(
                    (
                        keyObj,
                    ): [typeof CACHE_EVENTS.NOT_FOUND, NotFoundCacheEvent] =>
                        [
                            CACHE_EVENTS.NOT_FOUND,
                            {
                                key: keyObj,
                            },
                        ] as const,
                );
                for (const [eventName, event] of events) {
                    callInvokable(
                        this.waitUntil,
                        this.eventBus.dispatch(eventName, event),
                    );
                }
            }
            return hasRemovedAtLeastOne;
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    keys: keyObjArr.map((keyObj) => keyObj.get()),
                    method: this.remove.name,
                    error,
                }),
            );
            throw error;
        }
    }

    async clear(): Promise<void> {
        try {
            await this.adapter.removeByKeyPrefix(
                this.executionContext,
                this.namespace.toString(),
            );
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.CLEARED, {}),
            );
        } catch (error: unknown) {
            callInvokable(
                this.waitUntil,
                this.eventBus.dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                    method: this.clear.name,
                    error,
                }),
            );
            throw error;
        }
    }
}

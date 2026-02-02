/* eslint-disable @typescript-eslint/no-empty-object-type */
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
} from "@/cache/contracts/_module.js";
import { type CacheAdapterVariants } from "@/cache/contracts/types.js";
import { resolveCacheAdapter } from "@/cache/implementations/derivables/cache/resolve-cache-adapter.js";
import { type IEventBus } from "@/event-bus/contracts/_module.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type INamespace } from "@/namespace/contracts/_module.js";
import { NoOpNamespace } from "@/namespace/implementations/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
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
     * @default
     * ```ts
     * import { EventBus } from "@daiso-tech/core/event-bus";
     * import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";
     *
     * new EventBus({
     *   adapter: new NoOpEventBusAdapter()
     * })
     * ```
     */
    eventBus?: IEventBus;

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
};

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache"`
 * @group Derivables
 */
export type CacheSettings<TType = unknown> = CacheSettingsBase<TType> & {
    adapter: CacheAdapterVariants<any>;
};

/**
 *
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
            eventBus = new EventBus<any>({
                adapter: new NoOpEventBusAdapter(),
            }),
            defaultTtl = null,
            defaultJitter = 0.2,
        } = settings;

        this.shouldValidateOutput = shouldValidateOutput;
        this.schema = schema;
        this.namespace = namespace;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.eventBus = eventBus;
        this.adapter = resolveCacheAdapter(adapter);
        this.defaultJitter = defaultJitter;
    }

    get events(): ICacheListenable<TType> {
        return this.eventBus;
    }

    exists(key: string): ITask<boolean> {
        return new Task(async () => {
            const value = await this.get(key);
            return value !== null;
        });
    }

    missing(key: string): ITask<boolean> {
        return new Task(async () => {
            const hasKey = await this.exists(key);
            return !hasKey;
        });
    }

    get(key: string): ITask<TType | null> {
        return new Task(async () => {
            const keyObj = this.namespace.create(key);
            try {
                const value = await this.adapter.get(keyObj.toString());
                if (this.shouldValidateOutput && value !== null) {
                    await validate(this.schema, value);
                }

                if (value === null) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.NOT_FOUND, {
                            key: keyObj,
                        })
                        .detach();
                } else {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.FOUND, {
                            key: keyObj,
                            value,
                        })
                        .detach();
                }

                return value;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: [keyObj.get()],
                        method: this.get.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }

    getOrFail(key: string): ITask<TType> {
        return new Task<TType>(async () => {
            const value = await this.get(key);
            if (value === null) {
                throw KeyNotFoundCacheError.create(this.namespace.create(key));
            }
            return value;
        });
    }

    getAndRemove(key: string): ITask<TType | null> {
        return new Task(async () => {
            const keyObj = this.namespace.create(key);
            try {
                const value = await this.adapter.getAndRemove(
                    keyObj.toString(),
                );
                if (this.shouldValidateOutput && value !== null) {
                    await validate(this.schema, value);
                }

                if (value === null) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.NOT_FOUND, {
                            key: keyObj,
                        })
                        .detach();
                } else {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.REMOVED, {
                            key: keyObj,
                        })
                        .detach();
                }
                return value;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: [keyObj.get()],
                        method: this.get.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }

    getOr(
        key: string,
        defaultValue: AsyncLazyable<NoneFunc<TType>>,
    ): ITask<TType> {
        return new Task<TType>(async () => {
            const value = await this.get(key);
            if (value === null) {
                const simplifiedValueToAdd =
                    await resolveAsyncLazyable(defaultValue);
                return simplifiedValueToAdd;
            }
            return value;
        });
    }

    getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<NoneFunc<TType>>,
        settings?: CacheWriteSettings,
    ): ITask<TType> {
        return new Task<TType>(async () => {
            const ttl = this.resolveCacheWriteSettings(settings);
            const keyObj = this.namespace.create(key);
            const value = await this.adapter.get(keyObj.toString());
            if (this.shouldValidateOutput && value !== null) {
                await validate(this.schema, value);
            }
            if (value === null) {
                const resolvedValueToAdd =
                    await resolveAsyncLazyable(valueToAdd);
                await validate(this.schema, resolvedValueToAdd);
                const hasAdded = await this.adapter.add(
                    keyObj.toString(),
                    resolvedValueToAdd,
                    ttl,
                );
                if (hasAdded) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.ADDED, {
                            key: keyObj,
                            value: resolvedValueToAdd,
                            ttl,
                        })
                        .detach();
                }
                return resolvedValueToAdd;
            } else {
                this.eventBus
                    .dispatch(CACHE_EVENTS.FOUND, {
                        key: keyObj,
                        value,
                    })
                    .detach();
            }

            return value;
        });
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

    add(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): ITask<boolean> {
        return new Task(async () => {
            const ttl = this.resolveCacheWriteSettings(settings);
            const keyObj = this.namespace.create(key);
            try {
                await validate(this.schema, value);
                const hasAdded = await this.adapter.add(
                    keyObj.toString(),
                    value,
                    ttl,
                );
                if (hasAdded) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.ADDED, {
                            key: keyObj,
                            value,
                            ttl,
                        })
                        .detach();
                } else {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.KEY_EXISTS, {
                            key: keyObj,
                        })
                        .detach();
                }
                return hasAdded;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: [keyObj.get()],
                        value,
                        method: this.add.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }

    addOrFail(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): ITask<void> {
        return new Task(async () => {
            const isNotFound = await this.add(key, value, settings);
            if (!isNotFound) {
                throw KeyExistsCacheError.create(this.namespace.create(key));
            }
        });
    }

    put(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): ITask<boolean> {
        return new Task(async () => {
            const ttl = this.resolveCacheWriteSettings(settings);
            const keyObj = this.namespace.create(key);
            try {
                await validate(this.schema, value);
                const hasUpdated = await this.adapter.put(
                    keyObj.toString(),
                    value,
                    ttl,
                );
                if (hasUpdated) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.UPDATED, {
                            key: keyObj,
                            value,
                        })
                        .detach();
                } else {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.ADDED, {
                            key: keyObj,
                            value,
                            ttl,
                        })
                        .detach();
                }
                return hasUpdated;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: [keyObj.get()],
                        value,
                        method: this.put.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }

    update(key: string, value: TType): ITask<boolean> {
        return new Task(async () => {
            const keyObj = this.namespace.create(key);
            try {
                await validate(this.schema, value);
                const hasUpdated = await this.adapter.update(
                    keyObj.toString(),
                    value,
                );
                if (hasUpdated) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.UPDATED, {
                            key: keyObj,
                            value,
                        })
                        .detach();
                } else {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.NOT_FOUND, {
                            key: keyObj,
                        })
                        .detach();
                }
                return hasUpdated;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: [keyObj.get()],
                        value,
                        method: this.update.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }

    updateOrFail(key: string, value: TType): ITask<void> {
        return new Task(async () => {
            const isFound = await this.update(key, value);
            if (!isFound) {
                throw KeyNotFoundCacheError.create(this.namespace.create(key));
            }
        });
    }

    increment(
        key: string,
        value = 1 as Extract<TType, number>,
    ): ITask<boolean> {
        return new Task(async () => {
            const keyObj = this.namespace.create(key);
            try {
                const hasUpdated = await this.adapter.increment(
                    keyObj.toString(),
                    value,
                );
                if (hasUpdated && value > 0) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.INCREMENTED, {
                            key: keyObj,
                            value,
                        })
                        .detach();
                }
                if (hasUpdated && value < 0) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.DECREMENTED, {
                            key: keyObj,
                            value: -value,
                        })
                        .detach();
                }
                if (!hasUpdated) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.NOT_FOUND, {
                            key: keyObj,
                        })
                        .detach();
                }
                return hasUpdated;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: [keyObj.get()],
                        value,
                        method: this.increment.name,
                        error,
                    })
                    .detach();
                throw new TypeError(
                    `Unable to increment or decrement none number type key "${keyObj.get()}"`,
                    { cause: error },
                );
            }
        });
    }

    incrementOrFail(key: string, value?: Extract<TType, number>): ITask<void> {
        return new Task(async () => {
            const isFound = await this.increment(key, value);
            if (!isFound) {
                throw KeyNotFoundCacheError.create(this.namespace.create(key));
            }
        });
    }

    decrement(
        key: string,
        value = 1 as Extract<TType, number>,
    ): ITask<boolean> {
        return new Task(async () => {
            return await this.increment(key, -value as Extract<TType, number>);
        });
    }

    decrementOrFail(key: string, value?: Extract<TType, number>): ITask<void> {
        return new Task(async () => {
            const isFound = await this.decrement(key, value);
            if (!isFound) {
                throw KeyNotFoundCacheError.create(this.namespace.create(key));
            }
        });
    }

    remove(key: string): ITask<boolean> {
        return new Task(async () => {
            const keyObj = this.namespace.create(key);
            try {
                const hasRemoved = await this.adapter.removeMany([
                    keyObj.toString(),
                ]);
                if (hasRemoved) {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.REMOVED, {
                            key: keyObj,
                        })
                        .detach();
                } else {
                    this.eventBus
                        .dispatch(CACHE_EVENTS.NOT_FOUND, {
                            key: keyObj,
                        })
                        .detach();
                }
                return hasRemoved;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: [keyObj.get()],
                        method: this.remove.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }

    removeOrFail(key: string): ITask<void> {
        return new Task(async () => {
            const isFound = await this.remove(key);
            if (!isFound) {
                throw KeyNotFoundCacheError.create(this.namespace.create(key));
            }
        });
    }

    removeMany(keys: Iterable<string>): ITask<boolean> {
        return new Task(async () => {
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
                        this.eventBus.dispatch(eventName, event).detach();
                    }
                } else {
                    const events = keyObjArr.map(
                        (
                            keyObj,
                        ): [
                            typeof CACHE_EVENTS.NOT_FOUND,
                            NotFoundCacheEvent,
                        ] =>
                            [
                                CACHE_EVENTS.NOT_FOUND,
                                {
                                    key: keyObj,
                                },
                            ] as const,
                    );
                    for (const [eventName, event] of events) {
                        this.eventBus.dispatch(eventName, event).detach();
                    }
                }
                return hasRemovedAtLeastOne;
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        keys: keyObjArr.map((keyObj) => keyObj.get()),
                        method: this.remove.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }

    clear(): ITask<void> {
        return new Task(async () => {
            try {
                const promise = this.eventBus.dispatch(
                    CACHE_EVENTS.CLEARED,
                    {},
                );
                await this.adapter.removeByKeyPrefix(this.namespace.toString());
                promise.detach();
            } catch (error: unknown) {
                this.eventBus
                    .dispatch(CACHE_EVENTS.UNEXPECTED_ERROR, {
                        method: this.clear.name,
                        error,
                    })
                    .detach();
                throw error;
            }
        });
    }
}

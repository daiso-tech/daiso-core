/**
 * @module Semaphore
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { type AsyncMiddlewareFn } from "@/hooks/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type SemaphoreAdapterVariants,
    type SemaphoreEventMap,
    type ISemaphore,
    type SemaphoreAquireBlockingSettings,
    FailedRefreshSemaphoreError,
    LimitReachedSemaphoreError,
    FailedReleaseSemaphoreError,
    SEMAPHORE_EVENTS,
    SEMAPHORE_STATE,
    isSemaphoreError,
    type ISemaphoreState,
} from "@/semaphore/contracts/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { Task } from "@/task/implementations/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { resolveLazyable, type AsyncLazy } from "@/utilities/_module.js";

/**
 * @internal
 */
export type ISerializedSemaphore = {
    version: "1";
    key: string;
    slotId: string;
    limit: number;
    ttlInMs: number | null;
};

/**
 * @internal
 */
export type SemaphoreSettings = {
    slotId: string;
    limit: number;
    serdeTransformerName: string;
    adapter: ISemaphoreAdapter;
    originalAdapter: SemaphoreAdapterVariants;
    eventDispatcher: IEventDispatcher<SemaphoreEventMap>;
    key: IKey;
    ttl: TimeSpan | null;
    defaultBlockingInterval: TimeSpan;
    defaultBlockingTime: TimeSpan;
    defaultRefreshTime: TimeSpan;
    namespace: INamespace;
};

/**
 * @internal
 */
export class Semaphore implements ISemaphore {
    /**
     * @internal
     */
    static _internal_serialize(
        deserializedValue: Semaphore,
    ): ISerializedSemaphore {
        return {
            version: "1",
            key: deserializedValue._key.get(),
            limit: deserializedValue.limit,
            slotId: deserializedValue.slotId,
            ttlInMs: deserializedValue._ttl?.toMilliseconds() ?? null,
        };
    }

    private readonly slotId: string;
    private readonly limit: number;
    private readonly adapter: ISemaphoreAdapter;
    private readonly originalAdapter: SemaphoreAdapterVariants;
    private readonly eventDispatcher: IEventDispatcher<SemaphoreEventMap>;
    private readonly _key: IKey;
    private _ttl: TimeSpan | null;
    private readonly defaultBlockingInterval: TimeSpan;
    private readonly defaultBlockingTime: TimeSpan;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly namespace: INamespace;

    constructor(settings: SemaphoreSettings) {
        const {
            slotId,
            limit,
            adapter,
            originalAdapter,
            eventDispatcher,
            key,
            ttl,
            serdeTransformerName,
            defaultBlockingInterval,
            defaultBlockingTime,
            defaultRefreshTime,
            namespace,
        } = settings;
        this.namespace = namespace;
        this.slotId = slotId;
        this.limit = limit;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.eventDispatcher = eventDispatcher;
        this._key = key;
        this._ttl = ttl;
        this.defaultBlockingInterval = defaultBlockingInterval;
        this.defaultBlockingTime = defaultBlockingTime;
        this.defaultRefreshTime = defaultRefreshTime;
        this.originalAdapter = originalAdapter;
    }

    _internal_getNamespace(): INamespace {
        return this.namespace;
    }

    _internal_getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _internal_getAdapter(): SemaphoreAdapterVariants {
        return this.originalAdapter;
    }

    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): ITask<TValue> {
        return new Task(async () => {
            try {
                await this.acquireOrFail();
                return await resolveLazyable(asyncFn);
            } finally {
                await this.release();
            }
        });
    }

    runBlockingOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
        settings?: SemaphoreAquireBlockingSettings,
    ): ITask<TValue> {
        return new Task(async () => {
            try {
                await this.acquireBlockingOrFail(settings);

                return await resolveLazyable(asyncFn);
            } finally {
                await this.release();
            }
        });
    }

    private handleUnexpectedError = <
        TParameters extends Array<unknown>,
        TReturn,
    >(): AsyncMiddlewareFn<TParameters, TReturn> => {
        return async (args, next) => {
            try {
                return await next(...args);
            } catch (error: unknown) {
                if (isSemaphoreError(error)) {
                    throw error;
                }

                this.eventDispatcher
                    .dispatch(SEMAPHORE_EVENTS.UNEXPECTED_ERROR, {
                        error,
                        semaphore: this,
                    })
                    .detach();

                throw error;
            }
        };
    };

    private handleDispatch = <
        TParameters extends Array<unknown>,
        TEventName extends keyof SemaphoreEventMap,
        TEvent extends SemaphoreEventMap[TEventName],
    >(settings: {
        on: "true" | "false";
        eventName: TEventName;
        eventData: TEvent;
    }): AsyncMiddlewareFn<TParameters, boolean> => {
        return async (args, next) => {
            const result = await next(...args);
            if (result && settings.on === "true") {
                this.eventDispatcher
                    .dispatch(settings.eventName, settings.eventData)
                    .detach();
            }
            if (!result && settings.on === "false") {
                this.eventDispatcher
                    .dispatch(settings.eventName, settings.eventData)
                    .detach();
            }
            return result;
        };
    };

    acquire(): ITask<boolean> {
        return new Task(async () => {
            return await this.adapter.acquire({
                key: this._key.toString(),
                slotId: this.slotId,
                limit: this.limit,
                ttl: this._ttl,
            });
        }).pipe([
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SEMAPHORE_EVENTS.ACQUIRED,
                eventData: {
                    semaphore: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SEMAPHORE_EVENTS.LIMIT_REACHED,
                eventData: {
                    semaphore: this,
                },
            }),
        ]);
    }

    acquireOrFail(): ITask<void> {
        return new Task(async () => {
            const hasAquired = await this.acquire();
            if (!hasAquired) {
                throw LimitReachedSemaphoreError.create(this._key);
            }
        });
    }

    acquireBlocking(
        settings: SemaphoreAquireBlockingSettings = {},
    ): ITask<boolean> {
        return new Task(async () => {
            const {
                time = this.defaultBlockingTime,
                interval = this.defaultBlockingInterval,
            } = settings;
            const timeAsTimeSpan = TimeSpan.fromTimeSpan(time);
            const intervalAsTimeSpan = TimeSpan.fromTimeSpan(interval);
            const endDate = timeAsTimeSpan.toEndDate();
            while (endDate.getTime() > new Date().getTime()) {
                const hasAquired = await this.acquire();
                if (hasAquired) {
                    return true;
                }
                await Task.delay(intervalAsTimeSpan);
            }
            return false;
        });
    }

    acquireBlockingOrFail(
        settings?: SemaphoreAquireBlockingSettings,
    ): ITask<void> {
        return new Task(async () => {
            const hasAquired = await this.acquireBlocking(settings);
            if (!hasAquired) {
                throw LimitReachedSemaphoreError.create(this._key);
            }
        });
    }

    release(): ITask<boolean> {
        return new Task(async () => {
            return await this.adapter.release(
                this._key.toString(),
                this.slotId,
            );
        }).pipe([
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SEMAPHORE_EVENTS.RELEASED,
                eventData: {
                    semaphore: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SEMAPHORE_EVENTS.FAILED_RELEASE,
                eventData: {
                    semaphore: this,
                },
            }),
        ]);
    }

    releaseOrFail(): ITask<void> {
        return new Task(async () => {
            const hasReleased = await this.release();
            if (!hasReleased) {
                throw FailedReleaseSemaphoreError.create(
                    this._key,
                    this.slotId,
                );
            }
        });
    }

    forceReleaseAll(): ITask<boolean> {
        return new Task(async () => {
            return await this.adapter.forceReleaseAll(this._key.toString());
        }).pipe([
            this.handleUnexpectedError(),
            async (args, next) => {
                const hasReleased = await next(...args);
                this.eventDispatcher
                    .dispatch(SEMAPHORE_EVENTS.ALL_FORCE_RELEASED, {
                        semaphore: this,
                        hasReleased,
                    })
                    .detach();
                return hasReleased;
            },
        ]);
    }

    refresh(ttl: ITimeSpan = this.defaultRefreshTime): ITask<boolean> {
        return new Task(async () => {
            return await this.adapter.refresh(
                this._key.toString(),
                this.slotId,
                TimeSpan.fromTimeSpan(ttl),
            );
        }).pipe([
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SEMAPHORE_EVENTS.REFRESHED,
                eventData: {
                    semaphore: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SEMAPHORE_EVENTS.FAILED_REFRESH,
                eventData: {
                    semaphore: this,
                },
            }),
            async (args, next) => {
                const hasRefreshed = await next(...args);
                if (hasRefreshed) {
                    this._ttl = TimeSpan.fromTimeSpan(ttl);
                }
                return hasRefreshed;
            },
        ]);
    }

    refreshOrFail(ttl?: ITimeSpan): ITask<void> {
        return new Task(async () => {
            const hasRefreshed = await this.refresh(ttl);
            if (!hasRefreshed) {
                throw FailedRefreshSemaphoreError.create(
                    this._key,
                    this.slotId,
                );
            }
        });
    }

    get id(): string {
        return this.slotId;
    }

    get ttl(): TimeSpan | null {
        return this._ttl;
    }

    get key(): IKey {
        return this._key;
    }

    getState(): ITask<ISemaphoreState> {
        return new Task(async () => {
            const state = await this.adapter.getState(this._key.toString());
            if (state === null) {
                return {
                    type: SEMAPHORE_STATE.EXPIRED,
                };
            }

            if (state.acquiredSlots.size >= state.limit) {
                return {
                    type: SEMAPHORE_STATE.LIMIT_REACHED,
                    limit: state.limit,
                    acquiredSlots: [...state.acquiredSlots.keys()],
                };
            }

            const slot = state.acquiredSlots.get(this.slotId);
            if (slot === undefined) {
                return {
                    type: SEMAPHORE_STATE.UNACQUIRED,
                    acquiredSlots: [...state.acquiredSlots.keys()],
                    acquiredSlotsCount: state.acquiredSlots.size,
                    freeSlotsCount: state.limit - state.acquiredSlots.size,
                    limit: state.limit,
                };
            }

            console.log(slot);

            return {
                type: SEMAPHORE_STATE.ACQUIRED,
                acquiredSlots: [...state.acquiredSlots.keys()],
                acquiredSlotsCount: state.acquiredSlots.size,
                freeSlotsCount: state.limit - state.acquiredSlots.size,
                limit: state.limit,
                remainingTime:
                    slot === null
                        ? null
                        : TimeSpan.fromDateRange({
                              start: new Date(),
                              end: slot,
                          }),
            };
        }).pipe(this.handleUnexpectedError());
    }
}

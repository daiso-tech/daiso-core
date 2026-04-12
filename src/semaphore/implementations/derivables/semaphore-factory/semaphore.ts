/**
 * @module Semaphore
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { type Use } from "@/middleware/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import {
    type ISemaphoreAdapter,
    type SemaphoreAdapterVariants,
    type SemaphoreEventMap,
    type ISemaphore,
    FailedRefreshSemaphoreError,
    LimitReachedSemaphoreError,
    FailedReleaseSemaphoreError,
    SEMAPHORE_EVENTS,
    SEMAPHORE_STATE,
    type ISemaphoreState,
} from "@/semaphore/contracts/_module.js";
import {
    handleDispatch,
    handleUnexpectedError,
} from "@/semaphore/implementations/derivables/semaphore-factory/event-helpers.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callInvokable,
    resolveLazyable,
    type AsyncLazy,
    type WaitUntil,
} from "@/utilities/_module.js";

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
    defaultRefreshTime: TimeSpan;
    namespace: INamespace;
    waitUntil: WaitUntil;
    executionContext: IExecutionContext;
    use: Use;
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
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly namespace: INamespace;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;
    private readonly use: Use;

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
            defaultRefreshTime,
            namespace,
            waitUntil,
            executionContext,
            use,
        } = settings;

        this.use = use;
        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.namespace = namespace;
        this.slotId = slotId;
        this.limit = limit;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.eventDispatcher = eventDispatcher;
        this._key = key;
        this._ttl = ttl;
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

    async runOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.acquireOrFail();
        try {
            return await resolveLazyable(asyncFn);
        } finally {
            await this.release();
        }
    }

    acquire(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.acquire({
                context: this.executionContext,
                key: this._key.toString(),
                slotId: this.slotId,
                limit: this.limit,
                ttl: this._ttl,
            });
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SEMAPHORE_EVENTS.ACQUIRED,
                eventData: {
                    semaphore: this,
                },
                eventDispatcher: this.eventDispatcher,
                waitUntil: this.waitUntil,
            }),
            handleDispatch({
                on: "false",
                eventName: SEMAPHORE_EVENTS.LIMIT_REACHED,
                eventData: {
                    semaphore: this,
                },
                eventDispatcher: this.eventDispatcher,
                waitUntil: this.waitUntil,
            }),
        ])();
    }

    async acquireOrFail(): Promise<void> {
        const hasAquired = await this.acquire();
        if (!hasAquired) {
            throw LimitReachedSemaphoreError.create(this._key);
        }
    }

    release(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.release(
                this.executionContext,
                this._key.toString(),
                this.slotId,
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SEMAPHORE_EVENTS.RELEASED,
                eventData: {
                    semaphore: this,
                },
                eventDispatcher: this.eventDispatcher,
                waitUntil: this.waitUntil,
            }),
            handleDispatch({
                on: "false",
                eventName: SEMAPHORE_EVENTS.FAILED_RELEASE,
                eventData: {
                    semaphore: this,
                },
                eventDispatcher: this.eventDispatcher,
                waitUntil: this.waitUntil,
            }),
        ])();
    }

    async releaseOrFail(): Promise<void> {
        const hasReleased = await this.release();
        if (!hasReleased) {
            throw FailedReleaseSemaphoreError.create(this._key, this.slotId);
        }
    }

    forceReleaseAll(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.forceReleaseAll(
                this.executionContext,
                this._key.toString(),
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            async ({ next }) => {
                const hasReleased = await next();
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        SEMAPHORE_EVENTS.ALL_FORCE_RELEASED,
                        {
                            semaphore: this,
                            hasReleased,
                        },
                    ),
                );
                return hasReleased;
            },
        ])();
    }

    refresh(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.refresh(
                this.executionContext,
                this._key.toString(),
                this.slotId,
                TimeSpan.fromTimeSpan(ttl),
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SEMAPHORE_EVENTS.REFRESHED,
                eventData: {
                    semaphore: this,
                },
                eventDispatcher: this.eventDispatcher,
                waitUntil: this.waitUntil,
            }),
            handleDispatch({
                on: "false",
                eventName: SEMAPHORE_EVENTS.FAILED_REFRESH,
                eventData: {
                    semaphore: this,
                },
                eventDispatcher: this.eventDispatcher,
                waitUntil: this.waitUntil,
            }),
            async ({ next }) => {
                const hasRefreshed = await next();
                if (hasRefreshed) {
                    this._ttl = TimeSpan.fromTimeSpan(ttl);
                }
                return hasRefreshed;
            },
        ])();
    }

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refresh(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshSemaphoreError.create(this._key, this.slotId);
        }
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

    getState(): Promise<ISemaphoreState> {
        return this.use(async () => {
            const state = await this.adapter.getState(
                this.executionContext,
                this._key.toString(),
            );
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
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
        ])();
    }
}

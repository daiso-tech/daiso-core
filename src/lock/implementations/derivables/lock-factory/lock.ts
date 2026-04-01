/**
 * @module Lock
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { AsyncHooks, type AsyncMiddlewareFn } from "@/hooks/_module.js";
import {
    type ILock,
    type ILockAdapter,
    FailedAcquireLockError,
    LOCK_EVENTS,
    FailedReleaseLockError,
    FailedRefreshLockError,
    type LockAquireBlockingSettings,
    type LockEventMap,
    LOCK_STATE,
    isLockError,
    type ILockState,
    type ILockExpiredState,
    type ILockAcquiredState,
    type ILockUnavailableState,
    type LockAdapterVariants,
} from "@/lock/contracts/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type AsyncLazy,
    callInvokable,
    type Invokable,
    resolveLazyable,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type ISerializedLock = {
    version: "1";
    key: string;
    lockId: string;
    ttlInMs: number | null;
};

/**
 * @internal
 */
export type LockSettings = {
    serdeTransformerName: string;
    namespace: INamespace;
    adapter: ILockAdapter;
    originalAdapter: LockAdapterVariants;
    eventDispatcher: IEventDispatcher<LockEventMap>;
    key: IKey;
    lockId: string;
    ttl: TimeSpan | null;
    defaultBlockingInterval: TimeSpan;
    defaultBlockingTime: TimeSpan;
    defaultRefreshTime: TimeSpan;
    waitUntil: Invokable<[promise: PromiseLike<unknown>], void>;
};

/**
 * @internal
 */
export class Lock implements ILock {
    /**
     * @internal
     */
    static _internal_serialize(deserializedValue: Lock): ISerializedLock {
        return {
            version: "1",
            key: deserializedValue._key.get(),
            lockId: deserializedValue.lockId,
            ttlInMs: deserializedValue._ttl?.toMilliseconds() ?? null,
        };
    }

    private readonly namespace: INamespace;
    private readonly adapter: ILockAdapter;
    private readonly originalAdapter: LockAdapterVariants;
    private readonly eventDispatcher: IEventDispatcher<LockEventMap>;
    private readonly _key: IKey;
    private readonly lockId: string;
    private _ttl: TimeSpan | null;
    private readonly defaultBlockingInterval: TimeSpan;
    private readonly defaultBlockingTime: TimeSpan;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly waitUntil: Invokable<
        [promise: PromiseLike<unknown>],
        void
    >;

    constructor(settings: LockSettings) {
        const {
            namespace,
            adapter,
            originalAdapter,
            eventDispatcher,
            key,
            lockId,
            ttl,
            serdeTransformerName,
            defaultBlockingInterval,
            defaultBlockingTime,
            defaultRefreshTime,
            waitUntil,
        } = settings;
        this.waitUntil = waitUntil;
        this.namespace = namespace;
        this.originalAdapter = originalAdapter;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.eventDispatcher = eventDispatcher;
        this._key = key;
        this.lockId = lockId;
        this._ttl = ttl;
        this.defaultBlockingInterval = defaultBlockingInterval;
        this.defaultBlockingTime = defaultBlockingTime;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    _internal_getNamespace(): INamespace {
        return this.namespace;
    }

    _internal_getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _internal_getAdapter(): LockAdapterVariants {
        return this.originalAdapter;
    }

    async runOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        try {
            await this.acquireOrFail();
            return await resolveLazyable(asyncFn);
        } finally {
            await this.release();
        }
    }

    async runBlockingOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
        settings?: LockAquireBlockingSettings,
    ): Promise<TValue> {
        try {
            await this.acquireBlockingOrFail(settings);

            return await resolveLazyable(asyncFn);
        } finally {
            await this.release();
        }
    }

    private handleUnexpectedError = <
        TParameters extends Array<unknown>,
        TReturn,
    >(): AsyncMiddlewareFn<TParameters, TReturn> => {
        return async (args, next) => {
            try {
                return await next(...args);
            } catch (error: unknown) {
                if (isLockError(error)) {
                    throw error;
                }

                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        LOCK_EVENTS.UNEXPECTED_ERROR,
                        {
                            error,
                            lock: this,
                        },
                    ),
                );

                throw error;
            }
        };
    };

    private handleDispatch = <
        TParameters extends Array<unknown>,
        TEventName extends keyof LockEventMap,
        TEvent extends LockEventMap[TEventName],
    >(settings: {
        on: "true" | "false";
        eventName: TEventName;
        eventData: TEvent;
    }): AsyncMiddlewareFn<TParameters, boolean> => {
        return async (args, next) => {
            const result = await next(...args);
            if (result && settings.on === "true") {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        settings.eventName,
                        settings.eventData,
                    ),
                );
            }
            if (!result && settings.on === "false") {
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        settings.eventName,
                        settings.eventData,
                    ),
                );
            }
            return result;
        };
    };

    async acquire(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.acquire(
                this._key.toString(),
                this.lockId,
                this._ttl,
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: LOCK_EVENTS.ACQUIRED,
                eventData: {
                    lock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: LOCK_EVENTS.UNAVAILABLE,
                eventData: {
                    lock: this,
                },
            }),
        ]).invoke();
    }

    async acquireOrFail(): Promise<void> {
        const hasAquired = await this.acquire();
        if (!hasAquired) {
            throw FailedAcquireLockError.create(this._key);
        }
    }

    async acquireBlocking(
        settings: LockAquireBlockingSettings = {},
    ): Promise<boolean> {
        const {
            time = this.defaultBlockingTime,
            interval = this.defaultBlockingInterval,
        } = settings;

        async function delay(ttl: ITimeSpan): Promise<void> {
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    resolve();
                }, TimeSpan.fromTimeSpan(ttl).toMilliseconds());
            });
        }

        const timeAsTimeSpan = TimeSpan.fromTimeSpan(time);
        const intervalAsTimeSpan = TimeSpan.fromTimeSpan(interval);
        const endDate = timeAsTimeSpan.toEndDate();
        while (endDate > new Date()) {
            const hasAquired = await this.acquire();
            if (hasAquired) {
                return true;
            }
            await delay(intervalAsTimeSpan);
        }
        return false;
    }

    async acquireBlockingOrFail(
        settings?: LockAquireBlockingSettings,
    ): Promise<void> {
        const hasAquired = await this.acquireBlocking(settings);
        if (!hasAquired) {
            throw FailedAcquireLockError.create(this._key);
        }
    }

    async release(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.release(
                this._key.toString(),
                this.lockId,
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: LOCK_EVENTS.RELEASED,
                eventData: {
                    lock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: LOCK_EVENTS.FAILED_RELEASE,
                eventData: {
                    lock: this,
                },
            }),
        ]).invoke();
    }

    async releaseOrFail(): Promise<void> {
        const hasRelased = await this.release();
        if (!hasRelased) {
            throw FailedReleaseLockError.create(this._key, this.lockId);
        }
    }

    async forceRelease(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.forceRelease(this._key.toString());
        }, [
            this.handleUnexpectedError(),
            async (args, next) => {
                const hasReleased = await next(...args);
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(LOCK_EVENTS.FORCE_RELEASED, {
                        lock: this,
                        hasReleased,
                    }),
                );
                return hasReleased;
            },
        ]).invoke();
    }

    async refresh(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.refresh(
                this._key.toString(),
                this.lockId,
                TimeSpan.fromTimeSpan(ttl),
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: LOCK_EVENTS.REFRESHED,
                eventData: {
                    lock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: LOCK_EVENTS.FAILED_REFRESH,
                eventData: {
                    lock: this,
                },
            }),
            async (args, next) => {
                const hasRefreshed = await next(...args);
                if (hasRefreshed) {
                    this._ttl = TimeSpan.fromTimeSpan(ttl);
                }
                return hasRefreshed;
            },
        ]).invoke();
    }

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refresh(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshLockError.create(this._key, this.lockId);
        }
    }

    get key(): IKey {
        return this._key;
    }

    get id(): string {
        return this.lockId;
    }

    get ttl(): TimeSpan | null {
        return this._ttl;
    }

    async getState(): Promise<ILockState> {
        return new AsyncHooks(async () => {
            const state = await this.adapter.getState(this._key.toString());
            if (state === null) {
                return {
                    type: LOCK_STATE.EXPIRED,
                } satisfies ILockExpiredState;
            }
            if (state.owner === this.lockId) {
                return {
                    type: LOCK_STATE.ACQUIRED,
                    remainingTime:
                        state.expiration === null
                            ? null
                            : TimeSpan.fromDateRange({
                                  start: new Date(),
                                  end: state.expiration,
                              }),
                } satisfies ILockAcquiredState;
            }
            return {
                type: LOCK_STATE.UNAVAILABLE,
                owner: state.owner,
            } satisfies ILockUnavailableState;
        }, [this.handleUnexpectedError()]).invoke();
    }
}

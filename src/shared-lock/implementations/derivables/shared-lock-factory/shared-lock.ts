/**
 * @module SharedLock
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { AsyncHooks, type AsyncMiddlewareFn } from "@/hooks/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    isSharedLockError,
    LimitReachedReaderSemaphoreError,
    SHARED_LOCK_EVENTS,
    SHARED_LOCK_STATE,
    type ISharedLock,
    type ISharedLockAdapter,
    type ISharedLockExpiredState,
    type ISharedLockReaderAcquiredState,
    type ISharedLockReaderLimitReachedState,
    type ISharedLockReaderUnacquiredState,
    type ISharedLockState,
    type ISharedLockWriterAcquiredState,
    type ISharedLockWriterUnavailableState,
    type SharedLockAdapterVariants,
    type SharedLockAquireBlockingSettings,
    type SharedLockEventMap,
} from "@/shared-lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callInvokable,
    delay,
    resolveLazyable,
    UnexpectedError,
    type AsyncLazy,
    type WaitUntil,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export type ISerializedSharedLock = {
    version: "1";
    key: string;
    lockId: string;
    limit: number;
    ttlInMs: number | null;
};

/**
 * @internal
 */
export type SharedLockSettings = {
    serdeTransformerName: string;
    namespace: INamespace;
    adapter: ISharedLockAdapter;
    originalAdapter: SharedLockAdapterVariants;
    eventDispatcher: IEventDispatcher<SharedLockEventMap>;
    limit: number;
    key: IKey;
    lockId: string;
    ttl: TimeSpan | null;
    defaultBlockingInterval: TimeSpan;
    defaultBlockingTime: TimeSpan;
    defaultRefreshTime: TimeSpan;
    waitUntil: WaitUntil;
    executionContext: IExecutionContext;
};

/**
 * @internal
 */
export class SharedLock implements ISharedLock {
    /**
     * @internal
     */
    static _internal_serialize(
        deserializedValue: SharedLock,
    ): ISerializedSharedLock {
        return {
            version: "1",
            key: deserializedValue._key.get(),
            limit: deserializedValue.limit,
            lockId: deserializedValue.lockId,
            ttlInMs: deserializedValue._ttl?.toMilliseconds() ?? null,
        };
    }

    private readonly namespace: INamespace;
    private readonly adapter: ISharedLockAdapter;
    private readonly originalAdapter: SharedLockAdapterVariants;
    private readonly eventDispatcher: IEventDispatcher<SharedLockEventMap>;
    private readonly _key: IKey;
    private readonly lockId: string;
    private _ttl: TimeSpan | null;
    private readonly defaultBlockingInterval: TimeSpan;
    private readonly defaultBlockingTime: TimeSpan;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly limit: number;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;

    constructor(settings: SharedLockSettings) {
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
            limit,
            waitUntil,
            executionContext,
        } = settings;

        this.executionContext = executionContext;
        this.waitUntil = waitUntil;
        this.limit = limit;
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

    _internal_getAdapter(): SharedLockAdapterVariants {
        return this.originalAdapter;
    }

    async runReaderOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.acquireReaderOrFail();
        try {
            return await resolveLazyable(asyncFn);
        } finally {
            await this.releaseReader();
        }
    }

    async runReaderBlockingOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
        settings?: SharedLockAquireBlockingSettings,
    ): Promise<TValue> {
        await this.acquireReaderBlockingOrFail(settings);
        try {
            return await resolveLazyable(asyncFn);
        } finally {
            await this.releaseReader();
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
                if (isSharedLockError(error)) {
                    throw error;
                }

                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        SHARED_LOCK_EVENTS.UNEXPECTED_ERROR,
                        {
                            error,
                            sharedLock: this,
                        },
                    ),
                );

                throw error;
            }
        };
    };

    private handleDispatch = <
        TParameters extends Array<unknown>,
        TEventName extends keyof SharedLockEventMap,
        TEvent extends SharedLockEventMap[TEventName],
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

    acquireReader(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.acquireReader({
                context: this.executionContext,
                key: this._key.toString(),
                lockId: this.lockId,
                limit: this.limit,
                ttl: this._ttl,
            });
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.READER_ACQUIRED,
                eventData: {
                    sharedLock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.UNAVAILABLE,
                eventData: {
                    sharedLock: this,
                },
            }),
        ]).invoke();
    }

    async acquireReaderOrFail(): Promise<void> {
        const hasAquired = await this.acquireReader();
        if (!hasAquired) {
            throw LimitReachedReaderSemaphoreError.create(this._key);
        }
    }

    async acquireReaderBlocking(
        settings: SharedLockAquireBlockingSettings = {},
    ): Promise<boolean> {
        const {
            time = this.defaultBlockingTime,
            interval = this.defaultBlockingInterval,
        } = settings;

        const timeAsTimeSpan = TimeSpan.fromTimeSpan(time);
        const endDate = timeAsTimeSpan.toEndDate();
        while (endDate.getTime() > new Date().getTime()) {
            const hasAquired = await this.acquireReader();
            if (hasAquired) {
                return true;
            }
            await delay(interval);
        }
        return false;
    }

    async acquireReaderBlockingOrFail(
        settings?: SharedLockAquireBlockingSettings,
    ): Promise<void> {
        const hasAquired = await this.acquireReaderBlocking(settings);
        if (!hasAquired) {
            throw LimitReachedReaderSemaphoreError.create(this._key);
        }
    }

    releaseReader(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.releaseReader(
                this.executionContext,
                this._key.toString(),
                this.lockId,
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.READER_RELEASED,
                eventData: {
                    sharedLock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.READER_FAILED_RELEASE,
                eventData: {
                    sharedLock: this,
                },
            }),
        ]).invoke();
    }

    async releaseReaderOrFail(): Promise<void> {
        const hasReleased = await this.releaseReader();
        if (!hasReleased) {
            throw FailedReleaseReaderSemaphoreError.create(
                this._key,
                this.lockId,
            );
        }
    }

    forceReleaseAllReaders(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.forceReleaseAllReaders(
                this.executionContext,
                this._key.toString(),
            );
        }, [
            this.handleUnexpectedError(),
            async (args, next) => {
                const hasReleased = await next(...args);
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        SHARED_LOCK_EVENTS.READER_ALL_FORCE_RELEASED,
                        {
                            sharedLock: this,
                            hasReleased,
                        },
                    ),
                );
                return hasReleased;
            },
        ]).invoke();
    }

    refreshReader(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.refreshReader(
                this.executionContext,
                this._key.toString(),
                this.lockId,
                TimeSpan.fromTimeSpan(ttl),
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.READER_REFRESHED,
                eventData: {
                    sharedLock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.READER_FAILED_REFRESH,
                eventData: {
                    sharedLock: this,
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

    async refreshReaderOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refreshReader(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshReaderSemaphoreError.create(
                this._key,
                this.lockId,
            );
        }
    }

    async runWriterOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.acquireWriterOrFail();
        try {
            return await resolveLazyable(asyncFn);
        } finally {
            await this.releaseWriter();
        }
    }

    async runWriterBlockingOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
        settings?: SharedLockAquireBlockingSettings,
    ): Promise<TValue> {
        await this.acquireWriterBlockingOrFail(settings);
        try {
            return await resolveLazyable(asyncFn);
        } finally {
            await this.releaseWriter();
        }
    }

    acquireWriter(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.acquireWriter(
                this.executionContext,
                this._key.toString(),
                this.lockId,
                this._ttl,
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.WRITER_ACQUIRED,
                eventData: {
                    sharedLock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.UNAVAILABLE,
                eventData: {
                    sharedLock: this,
                },
            }),
        ]).invoke();
    }

    async acquireWriterOrFail(): Promise<void> {
        const hasAquired = await this.acquireWriter();
        if (!hasAquired) {
            throw FailedAcquireWriterLockError.create(this._key);
        }
    }

    async acquireWriterBlocking(
        settings: SharedLockAquireBlockingSettings = {},
    ): Promise<boolean> {
        const {
            time = this.defaultBlockingTime,
            interval = this.defaultBlockingInterval,
        } = settings;

        const timeAsTimeSpan = TimeSpan.fromTimeSpan(time);
        const endDate = timeAsTimeSpan.toEndDate();
        while (endDate.getTime() > new Date().getTime()) {
            const hasAquired = await this.acquireWriter();
            if (hasAquired) {
                return true;
            }
            await delay(interval);
        }
        return false;
    }

    async acquireWriterBlockingOrFail(
        settings?: SharedLockAquireBlockingSettings,
    ): Promise<void> {
        const hasAquired = await this.acquireWriterBlocking(settings);
        if (!hasAquired) {
            throw FailedAcquireWriterLockError.create(this._key);
        }
    }

    releaseWriter(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.releaseWriter(
                this.executionContext,
                this._key.toString(),
                this.lockId,
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.WRITER_RELEASED,
                eventData: {
                    sharedLock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.WRITER_FAILED_RELEASE,
                eventData: {
                    sharedLock: this,
                },
            }),
        ]).invoke();
    }

    async releaseWriterOrFail(): Promise<void> {
        const hasRelased = await this.releaseWriter();
        if (!hasRelased) {
            throw FailedReleaseWriterLockError.create(this._key, this.lockId);
        }
    }

    forceReleaseWriter(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.forceReleaseWriter(
                this.executionContext,
                this._key.toString(),
            );
        }, [
            this.handleUnexpectedError(),
            async (args, next) => {
                const hasReleased = await next(...args);
                callInvokable(
                    this.waitUntil,
                    this.eventDispatcher.dispatch(
                        SHARED_LOCK_EVENTS.WRITER_FORCE_RELEASED,
                        {
                            sharedLock: this,
                            hasReleased,
                        },
                    ),
                );
                return hasReleased;
            },
        ]).invoke();
    }

    refreshWriter(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.refreshWriter(
                this.executionContext,
                this._key.toString(),
                this.lockId,
                TimeSpan.fromTimeSpan(ttl),
            );
        }, [
            this.handleUnexpectedError(),
            this.handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.WRITER_REFRESHED,
                eventData: {
                    sharedLock: this,
                },
            }),
            this.handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.WRITER_FAILED_REFRESH,
                eventData: {
                    sharedLock: this,
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

    async refreshWriterOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refreshWriter(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshWriterLockError.create(this._key, this.lockId);
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

    forceRelease(): Promise<boolean> {
        return new AsyncHooks(async () => {
            return await this.adapter.forceRelease(
                this.executionContext,
                this._key.toString(),
            );
        }, [this.handleUnexpectedError()]).invoke();
    }

    getState(): Promise<ISharedLockState> {
        return new AsyncHooks<[], ISharedLockState>(async () => {
            const state = await this.adapter.getState(
                this.executionContext,
                this._key.toString(),
            );
            if (state === null) {
                return {
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState;
            }

            if (state.writer && state.writer.owner === this.lockId) {
                return {
                    type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                    remainingTime:
                        state.writer.expiration === null
                            ? null
                            : TimeSpan.fromDateRange({
                                  start: new Date(),
                                  end: state.writer.expiration,
                              }),
                } satisfies ISharedLockWriterAcquiredState;
            }

            if (state.writer && state.writer.owner !== this.lockId) {
                return {
                    type: SHARED_LOCK_STATE.WRITER_UNAVAILABLE,
                    owner: state.writer.owner,
                } satisfies ISharedLockWriterUnavailableState;
            }

            if (
                state.reader !== null &&
                state.reader.acquiredSlots.size >= state.reader.limit
            ) {
                return {
                    type: SHARED_LOCK_STATE.READER_LIMIT_REACHED,
                    limit: state.reader.limit,
                    acquiredSlots: [...state.reader.acquiredSlots.keys()],
                } satisfies ISharedLockReaderLimitReachedState;
            }

            const slotExpiration = state.reader?.acquiredSlots.get(this.lockId);
            if (state.reader !== null && slotExpiration === undefined) {
                return {
                    type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                    limit: state.reader.limit,
                    freeSlotsCount:
                        state.reader.limit - state.reader.acquiredSlots.size,
                    acquiredSlotsCount: state.reader.acquiredSlots.size,
                    acquiredSlots: [...state.reader.acquiredSlots.keys()],
                } satisfies ISharedLockReaderUnacquiredState;
            }

            if (state.reader !== null && slotExpiration !== undefined) {
                return {
                    type: SHARED_LOCK_STATE.READER_ACQUIRED,
                    acquiredSlots: [...state.reader.acquiredSlots.keys()],
                    acquiredSlotsCount: state.reader.acquiredSlots.size,
                    freeSlotsCount:
                        state.reader.limit - state.reader.acquiredSlots.size,
                    limit: state.reader.limit,
                    remainingTime:
                        slotExpiration === null
                            ? null
                            : TimeSpan.fromDateRange({
                                  start: new Date(),
                                  end: slotExpiration,
                              }),
                } satisfies ISharedLockReaderAcquiredState;
            }

            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the reader field must be defined or the writer field must be defined, but not both.",
            );
        }, [this.handleUnexpectedError()]).invoke();
    }
}

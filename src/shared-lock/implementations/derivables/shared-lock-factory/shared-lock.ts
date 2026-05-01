/**
 * @module SharedLock
 */

import { type IEventDispatcher } from "@/event-bus/contracts/_module.js";
import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { type Use } from "@/middleware/contracts/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    LimitReachedReaderSemaphoreError,
    SHARED_LOCK_EVENTS,
    SHARED_LOCK_STATE,
    type ISharedLock,
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
    type ISharedLockExpiredState,
    type ISharedLockState,
    type SharedLockAdapterVariants,
    type SharedLockEventMap,
} from "@/shared-lock/contracts/_module.js";
import {
    handleDispatch,
    handleUnexpectedError,
} from "@/shared-lock/implementations/derivables/shared-lock-factory/event-helpers.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    callInvokable,
    OPTION,
    optionNone,
    optionSome,
    resolveLazyable,
    UnexpectedError,
    type AsyncLazy,
    type Option,
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
    defaultRefreshTime: TimeSpan;
    waitUntil: WaitUntil;
    executionContext: IExecutionContext;
    use: Use;
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
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly limit: number;
    private readonly waitUntil: WaitUntil;
    private readonly executionContext: IExecutionContext;
    private readonly use: Use;

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
            defaultRefreshTime,
            limit,
            waitUntil,
            executionContext,
            use,
        } = settings;

        this.use = use;
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

    acquireReader(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.acquireReader({
                context: this.executionContext,
                key: this._key.toString(),
                lockId: this.lockId,
                limit: this.limit,
                ttl: this._ttl,
            });
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.READER_ACQUIRED,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
            handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.UNAVAILABLE,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
        ])();
    }

    async acquireReaderOrFail(): Promise<void> {
        const hasAquired = await this.acquireReader();
        if (!hasAquired) {
            throw LimitReachedReaderSemaphoreError.create(this._key);
        }
    }

    releaseReader(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.releaseReader(
                this.executionContext,
                this._key.toString(),
                this.lockId,
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.READER_RELEASED,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
            handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.READER_FAILED_RELEASE,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
        ])();
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
        return this.use(async () => {
            return await this.adapter.forceReleaseAllReaders(
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
                        SHARED_LOCK_EVENTS.READER_ALL_FORCE_RELEASED,
                        {
                            sharedLock: this,
                            hasReleased,
                        },
                    ),
                );
                return hasReleased;
            },
        ])();
    }

    refreshReader(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.refreshReader(
                this.executionContext,
                this._key.toString(),
                this.lockId,
                TimeSpan.fromTimeSpan(ttl),
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.READER_REFRESHED,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
            handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.READER_FAILED_REFRESH,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
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

    acquireWriter(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.acquireWriter(
                this.executionContext,
                this._key.toString(),
                this.lockId,
                this._ttl,
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.WRITER_ACQUIRED,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
            handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.UNAVAILABLE,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
        ])();
    }

    async acquireWriterOrFail(): Promise<void> {
        const hasAquired = await this.acquireWriter();
        if (!hasAquired) {
            throw FailedAcquireWriterLockError.create(this._key);
        }
    }

    releaseWriter(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.releaseWriter(
                this.executionContext,
                this._key.toString(),
                this.lockId,
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.WRITER_RELEASED,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
            handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.WRITER_FAILED_RELEASE,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
        ])();
    }

    async releaseWriterOrFail(): Promise<void> {
        const hasRelased = await this.releaseWriter();
        if (!hasRelased) {
            throw FailedReleaseWriterLockError.create(this._key, this.lockId);
        }
    }

    forceReleaseWriter(): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.forceReleaseWriter(
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
                        SHARED_LOCK_EVENTS.WRITER_FORCE_RELEASED,
                        {
                            sharedLock: this,
                            hasReleased,
                        },
                    ),
                );
                return hasReleased;
            },
        ])();
    }

    refreshWriter(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        return this.use(async () => {
            return await this.adapter.refreshWriter(
                this.executionContext,
                this._key.toString(),
                this.lockId,
                TimeSpan.fromTimeSpan(ttl),
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
            handleDispatch({
                on: "true",
                eventName: SHARED_LOCK_EVENTS.WRITER_REFRESHED,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
            }),
            handleDispatch({
                on: "false",
                eventName: SHARED_LOCK_EVENTS.WRITER_FAILED_REFRESH,
                eventData: {
                    sharedLock: this,
                },
                waitUntil: this.waitUntil,
                eventDispatcher: this.eventDispatcher,
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
        return this.use(async () => {
            return await this.adapter.forceRelease(
                this.executionContext,
                this._key.toString(),
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
        ])();
    }

    private extractWriterState(
        state: ISharedLockAdapterState,
    ): Option<ISharedLockState> {
        if (state.writer && state.writer.owner === this.lockId) {
            return optionSome({
                type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                remainingTime:
                    state.writer.expiration === null
                        ? null
                        : TimeSpan.fromDateRange({
                              start: new Date(),
                              end: state.writer.expiration,
                          }),
            });
        }

        if (state.writer && state.writer.owner !== this.lockId) {
            return optionSome({
                type: SHARED_LOCK_STATE.WRITER_UNAVAILABLE,
                owner: state.writer.owner,
            });
        }

        return optionNone();
    }

    private extractReaderState(
        state: ISharedLockAdapterState,
    ): Option<ISharedLockState> {
        if (
            state.reader !== null &&
            state.reader.acquiredSlots.size >= state.reader.limit
        ) {
            return optionSome({
                type: SHARED_LOCK_STATE.READER_LIMIT_REACHED,
                limit: state.reader.limit,
                acquiredSlots: [...state.reader.acquiredSlots.keys()],
            });
        }

        const slotExpiration = state.reader?.acquiredSlots.get(this.lockId);
        if (state.reader !== null && slotExpiration === undefined) {
            return optionSome({
                type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                limit: state.reader.limit,
                freeSlotsCount:
                    state.reader.limit - state.reader.acquiredSlots.size,
                acquiredSlotsCount: state.reader.acquiredSlots.size,
                acquiredSlots: [...state.reader.acquiredSlots.keys()],
            });
        }

        if (state.reader !== null && slotExpiration !== undefined) {
            return optionSome({
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
            });
        }

        return optionNone();
    }

    getState(): Promise<ISharedLockState> {
        return this.use<[], Promise<ISharedLockState>>(async () => {
            const state = await this.adapter.getState(
                this.executionContext,
                this._key.toString(),
            );
            if (state === null) {
                return {
                    type: SHARED_LOCK_STATE.EXPIRED,
                } satisfies ISharedLockExpiredState;
            }

            const writerState = this.extractWriterState(state);
            if (writerState.type === OPTION.SOME) {
                return writerState.value;
            }

            const readerState = this.extractReaderState(state);
            if (readerState.type === OPTION.SOME) {
                return readerState.value;
            }

            throw new UnexpectedError(
                "Invalid ISharedLockAdapterState, expected either the reader field must be defined or the writer field must be defined, but not both.",
            );
        }, [
            handleUnexpectedError(this.waitUntil, this.eventDispatcher, this),
        ])();
    }
}

/**
 * @module SharedLock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type IKey, type INamespace } from "@/namespace/contracts/_module.js";
import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    LimitReachedReaderSemaphoreError,
    SHARED_LOCK_STATE,
    type ISharedLock,
    type ISharedLockAdapter,
    type ISharedLockAdapterState,
    type ISharedLockExpiredState,
    type ISharedLockState,
    type SharedLockAdapterVariants,
} from "@/shared-lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    OPTION,
    optionNone,
    optionSome,
    resolveLazyable,
    UnexpectedError,
    type AsyncLazy,
    type Option,
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
    limit: number;
    key: IKey;
    lockId: string;
    ttl: TimeSpan | null;
    defaultRefreshTime: TimeSpan;
    context: IReadableContext;
};

/**
 * @internal
 */
export class SharedLock implements ISharedLock {
    /**
     * @internal
     */
    static _serialize(deserializedValue: SharedLock): ISerializedSharedLock {
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
    private readonly _key: IKey;
    private readonly lockId: string;
    private _ttl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly limit: number;
    private readonly context: IReadableContext;

    constructor(settings: SharedLockSettings) {
        const {
            namespace,
            adapter,
            originalAdapter,
            key,
            lockId,
            ttl,
            serdeTransformerName,
            defaultRefreshTime,
            limit,
            context,
        } = settings;

        this.context = context;
        this.limit = limit;
        this.namespace = namespace;
        this.originalAdapter = originalAdapter;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this._key = key;
        this.lockId = lockId;
        this._ttl = ttl;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    _getNamespace(): INamespace {
        return this.namespace;
    }

    _getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _getAdapter(): SharedLockAdapterVariants {
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

    async acquireReader(): Promise<boolean> {
        return await this.adapter.acquireReader({
            context: this.context,
            key: this._key.toString(),
            lockId: this.lockId,
            limit: this.limit,
            ttl: this._ttl,
        });
    }

    async acquireReaderOrFail(): Promise<void> {
        const hasAquired = await this.acquireReader();
        if (!hasAquired) {
            throw LimitReachedReaderSemaphoreError.create(this._key);
        }
    }

    async releaseReader(): Promise<boolean> {
        return await this.adapter.releaseReader(
            this.context,
            this._key.toString(),
            this.lockId,
        );
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

    async forceReleaseAllReaders(): Promise<boolean> {
        return await this.adapter.forceReleaseAllReaders(
            this.context,
            this._key.toString(),
        );
    }

    async refreshReader(
        ttl: ITimeSpan = this.defaultRefreshTime,
    ): Promise<boolean> {
        const hasRefreshed = await this.adapter.refreshReader(
            this.context,
            this._key.toString(),
            this.lockId,
            TimeSpan.fromTimeSpan(ttl),
        );
        if (hasRefreshed) {
            this._ttl = TimeSpan.fromTimeSpan(ttl);
        }
        return hasRefreshed;
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

    async acquireWriter(): Promise<boolean> {
        return await this.adapter.acquireWriter(
            this.context,
            this._key.toString(),
            this.lockId,
            this._ttl,
        );
    }

    async acquireWriterOrFail(): Promise<void> {
        const hasAquired = await this.acquireWriter();
        if (!hasAquired) {
            throw FailedAcquireWriterLockError.create(this._key);
        }
    }

    async releaseWriter(): Promise<boolean> {
        return await this.adapter.releaseWriter(
            this.context,
            this._key.toString(),
            this.lockId,
        );
    }

    async releaseWriterOrFail(): Promise<void> {
        const hasRelased = await this.releaseWriter();
        if (!hasRelased) {
            throw FailedReleaseWriterLockError.create(this._key, this.lockId);
        }
    }

    async forceReleaseWriter(): Promise<boolean> {
        return await this.adapter.forceReleaseWriter(
            this.context,
            this._key.toString(),
        );
    }

    async refreshWriter(
        ttl: ITimeSpan = this.defaultRefreshTime,
    ): Promise<boolean> {
        const hasRefreshed = await this.adapter.refreshWriter(
            this.context,
            this._key.toString(),
            this.lockId,
            TimeSpan.fromTimeSpan(ttl),
        );
        if (hasRefreshed) {
            this._ttl = TimeSpan.fromTimeSpan(ttl);
        }
        return hasRefreshed;
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

    async forceRelease(): Promise<boolean> {
        return await this.adapter.forceRelease(
            this.context,
            this._key.toString(),
        );
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

    async getState(): Promise<ISharedLockState> {
        const state = await this.adapter.getState(
            this.context,
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
    }
}

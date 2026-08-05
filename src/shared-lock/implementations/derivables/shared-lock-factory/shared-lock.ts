/**
 * @module SharedLock
 */

import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    LimitReachedReaderSemaphoreError,
    SHARED_LOCK_STATE,
} from "@/shared-lock/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import {
    OPTION,
    optionNone,
    optionSome,
    resolveLazyable,
    UnexpectedError,
} from "@/utilities/_module.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    ISharedLock,
    ISharedLockAdapter,
    ISharedLockAdapterState,
    ISharedLockExpiredState,
    ISharedLockState,
} from "@/shared-lock/contracts/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";
import type { AsyncLazy, Option } from "@/utilities/_module.js";

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
    key: string;
    serdeTransformerName: string;
    adapter: ISharedLockAdapter;
    limit: number;
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
            key: deserializedValue._key,
            limit: deserializedValue.limit,
            lockId: deserializedValue.lockId,
            ttlInMs: deserializedValue._ttl?.toMilliseconds() ?? null,
        };
    }

    private readonly adapter: ISharedLockAdapter;
    private readonly _key: string;
    private readonly lockId: string;
    private _ttl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly limit: number;
    private readonly context: IReadableContext;

    constructor(settings: SharedLockSettings) {
        const {
            adapter,
            lockId,
            ttl,
            serdeTransformerName,
            defaultRefreshTime,
            limit,
            context,
            key,
        } = settings;

        this._key = key;
        this.context = context;
        this.limit = limit;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.lockId = lockId;
        this._ttl = ttl;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    _getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _getAdapter(): ISharedLockAdapter {
        return this.adapter;
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
            key: this._key,
            lockId: this.lockId,
            limit: this.limit,
            ttl: this._ttl,
        });
    }

    async acquireReaderOrFail(): Promise<void> {
        const hasAcquired = await this.acquireReader();
        if (!hasAcquired) {
            throw LimitReachedReaderSemaphoreError.create(this._key);
        }
    }

    async releaseReader(): Promise<boolean> {
        return await this.adapter.releaseReader(
            this._key,
            this.lockId,
            this.context,
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
            this._key,
            this.context,
        );
    }

    async refreshReader(
        ttl: ITimeSpan = this.defaultRefreshTime,
    ): Promise<boolean> {
        const hasRefreshed = await this.adapter.refreshReader(
            this._key,
            this.lockId,
            TimeSpan.fromTimeSpan(ttl),
            this.context,
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
            this._key,
            this.lockId,
            this._ttl,
            this.context,
        );
    }

    async acquireWriterOrFail(): Promise<void> {
        const hasAcquired = await this.acquireWriter();
        if (!hasAcquired) {
            throw FailedAcquireWriterLockError.create(this._key);
        }
    }

    async releaseWriter(): Promise<boolean> {
        return await this.adapter.releaseWriter(
            this._key,
            this.lockId,
            this.context,
        );
    }

    async releaseWriterOrFail(): Promise<void> {
        const hasRelased = await this.releaseWriter();
        if (!hasRelased) {
            throw FailedReleaseWriterLockError.create(this._key, this.lockId);
        }
    }

    async forceReleaseWriter(): Promise<boolean> {
        return await this.adapter.forceReleaseWriter(this._key, this.context);
    }

    async refreshWriter(
        ttl: ITimeSpan = this.defaultRefreshTime,
    ): Promise<boolean> {
        const hasRefreshed = await this.adapter.refreshWriter(
            this._key,
            this.lockId,
            TimeSpan.fromTimeSpan(ttl),
            this.context,
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

    get key(): string {
        return this._key;
    }

    get id(): string {
        return this.lockId;
    }

    get ttl(): TimeSpan | null {
        return this._ttl;
    }

    async forceRelease(): Promise<boolean> {
        return await this.adapter.forceRelease(this._key, this.context);
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
        const state = await this.adapter.getState(this._key, this.context);
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

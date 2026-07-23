/**
 * @module Lock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type ILock,
    type ILockAdapter,
    FailedAcquireLockError,
    FailedReleaseLockError,
    FailedRefreshLockError,
    LOCK_STATE,
    type ILockState,
    type ILockExpiredState,
    type ILockAcquiredState,
    type ILockUnavailableState,
} from "@/lock/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type AsyncLazy, resolveLazyable } from "@/utilities/_module.js";

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
    adapter: ILockAdapter;
    key: string;
    lockId: string;
    ttl: TimeSpan | null;
    defaultRefreshTime: TimeSpan;
    context: IReadableContext;
};

/**
 * @internal
 */
export class Lock implements ILock {
    /**
     * @internal
     */
    static _serialize(deserializedValue: Lock): ISerializedLock {
        return {
            version: "1",
            key: deserializedValue.key,
            lockId: deserializedValue.lockId,
            ttlInMs: deserializedValue._ttl?.toMilliseconds() ?? null,
        };
    }

    private readonly adapter: ILockAdapter;
    private readonly _key: string;
    private readonly lockId: string;
    private _ttl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serdeTransformerName: string;
    private readonly context: IReadableContext;

    constructor(settings: LockSettings) {
        const {
            adapter,
            key,
            lockId,
            ttl,
            serdeTransformerName,
            defaultRefreshTime,
            context,
        } = settings;

        this.context = context;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this._key = key;
        this.lockId = lockId;
        this._ttl = ttl;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    _getSerdeTransformerName(): string {
        return this.serdeTransformerName;
    }

    _getAdapter(): ILockAdapter {
        return this.adapter;
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

    async acquire(): Promise<boolean> {
        return await this.adapter.acquire(
            this.context,
            this._key.toString(),
            this.lockId,
            this._ttl,
        );
    }

    async acquireOrFail(): Promise<void> {
        const hasAquired = await this.acquire();
        if (!hasAquired) {
            throw FailedAcquireLockError.create(this._key);
        }
    }

    async release(): Promise<boolean> {
        return await this.adapter.release(
            this.context,
            this._key.toString(),
            this.lockId,
        );
    }

    async releaseOrFail(): Promise<void> {
        const hasRelased = await this.release();
        if (!hasRelased) {
            throw FailedReleaseLockError.create(this._key, this.lockId);
        }
    }

    async forceRelease(): Promise<boolean> {
        return await this.adapter.forceRelease(
            this.context,
            this._key.toString(),
        );
    }

    async refresh(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        const hasRefreshed = await this.adapter.refresh(
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

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refresh(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshLockError.create(this._key, this.lockId);
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

    async getState(): Promise<ILockState> {
        const state = await this.adapter.getState(
            this.context,
            this._key.toString(),
        );
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
    }
}

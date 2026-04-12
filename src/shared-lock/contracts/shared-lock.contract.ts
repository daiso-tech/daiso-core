/**
 * @module SharedLock
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type ISharedLockState } from "@/shared-lock/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    FailedRefreshReaderSemaphoreError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    FailedReleaseReaderSemaphoreError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    FailedReleaseWriterLockError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    FailedRefreshWriterLockError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type LimitReachedReaderSemaphoreError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type FailedAcquireWriterLockError,
} from "@/shared-lock/contracts/shared-lock.errors.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type AsyncLazy,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Invokable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type SharedLockAquireBlockingSettings = {
    time?: ITimeSpan;
    interval?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphore = {
    /**
     * The `runReaderOrFail` method wraps an {@link Invokable | `Invokable`} with the `acquireOrFail` and `release` method.
     * @throws {LimitReachedReaderSemaphoreError} {@link LimitReachedReaderSemaphoreError}
     */
    runReaderOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * The `acquireReader` method acquires an slots only if the slot limit is not reached.
     *
     * @returns Returns true if the slot limit is not reached otherwise false is returned.
     */
    acquireReader(): Promise<boolean>;

    /**
     * The `acquireReaderOrFail` method acquires an slots only if the slot limit is not reached.
     * Throws an error if the slot limit is reached.
     *
     * @throws {LimitReachedReaderSemaphoreError} {@link LimitReachedReaderSemaphoreError}
     */
    acquireReaderOrFail(): Promise<void>;

    /**
     * The `releaseReader` method releases the current slot.
     *
     * @returns Returns true if the semaphore exists and has at least one busy slot or false.
     */
    releaseReader(): Promise<boolean>;

    /**
     * The `releaseReaderOrFail` method releases the current slot.
     * Throws an error if the slot is not acquired.
     * @throws {FailedReleaseReaderSemaphoreError} {@link FailedReleaseReaderSemaphoreError}
     */
    releaseReaderOrFail(): Promise<void>;

    /**
     * The `forceReleaseAllReaders` method releases the all slots.
     *
     * @returns Returns true if the semaphore exists and has at least one unavailable slot or false if all slots are available.
     */
    forceReleaseAllReaders(): Promise<boolean>;

    /**
     * The `refreshReader` method updates the `ttl` of the slot when acquired.
     *
     * @returns Returns true if the slot is refreshed otherwise false is returned.
     */
    refreshReader(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * The `refreshReaderOrFail` method updates the `ttl` of the slot when acquired.
     * Throws an error if the slot is not acquired.
     * @throws {FailedRefreshReaderSemaphoreError} {@link FailedRefreshReaderSemaphoreError}
     */
    refreshReaderOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLock = {
    /**
     * The `runWriterOrFail` method wraps an {@link Invokable | `Invokable`} with the `acquireOrFail` and `release` method.
     * @throws {FailedAcquireWriterLockError} {@link FailedAcquireWriterLockError}
     */
    runWriterOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * The `acquireWriter` method acquires a lock only if the key is not already acquired by different owner.
     *
     * @returns Returns true if the lock is not already acquired otherwise false is returned.
     */
    acquireWriter(): Promise<boolean>;

    /**
     * The `acquireWriterOrFail` method acquires a lock only if the key is not already acquired by different owner.
     * Throws an error if the lock is already acquired by different owner.
     *
     * @throws {FailedAcquireWriterLockError} {@link FailedAcquireWriterLockError}
     */
    acquireWriterOrFail(): Promise<void>;

    /**
     * The `releaseWriter` method releases a lock if owned by the same owner.
     *
     * @returns Returns true if the lock is released otherwise false is returned.
     */
    releaseWriter(): Promise<boolean>;

    /**
     * The `releaseWriterOrFail` method releases a lock if owned by the same owner.
     * Throws an error if the lock is not owned by same owner.
     *
     * @throws {FailedReleaseWriterLockError} {@link FailedReleaseWriterLockError}
     */
    releaseWriterOrFail(): Promise<void>;

    /**
     * The `forceReleaseWriter` method releases a lock regardless of the owner.
     *
     * @returns Returns true if the lock exists or false if the lock doesnt exists.
     */
    forceReleaseWriter(): Promise<boolean>;

    /**
     * The `refreshWriter` method updates the `ttl` of the lock if expireable and owned by the same owner.
     *
     * @returns Returns true if the lock is refreshed otherwise false is returned.
     */
    refreshWriter(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * The `refreshWriterOrFail` method updates the `ttl` of the lock if expireable and owned by the same owner.
     * Throws an error if the lock is not owned by same owner.
     * Throws an error if the key is unexpirable.
     *
     * @throws {FailedRefreshWriterLockError} {@link FailedRefreshWriterLockError}
     */
    refreshWriterOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockStateMethods = {
    getState(): Promise<ISharedLockState>;

    /**
     * The `key` of the `ISharedLock` instance.
     */
    readonly key: IKey;

    /**
     * The `id` of the `ISharedLock` instance.
     */
    readonly id: string;

    /**
     * The `ttl` of `ISharedLock` instance.
     */
    readonly ttl: TimeSpan | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockBase = IReaderSemaphore &
    IWriterLock & {
        forceRelease(): Promise<boolean>;
    };

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLock = ISharedLockBase & ISharedLockStateMethods;

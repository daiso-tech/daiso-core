/**
 * @module SharedLock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type ISharedLockFactory } from "@/shared-lock/contracts/shared-lock-factory.contract.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Represents the persistent state of a writer lock in storage.
 * Contains information about ownership and expiration time.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLockAdapterState = {
    /**
     * The unique identifier of the entity that currently holds this writer lock.
     */
    owner: string;

    /**
     * The date and time when the writer lock expires and becomes available for others to acquire.
     * null indicates an indefinite lock with no expiration.
     */
    expiration: Date | null;
};

/**
 * Represents the persistent state of a reader semaphore in storage.
 * Contains information about the slot limit and currently acquired slots with their expiration times.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreAdapterState = {
    /**
     * Maximum number of concurrent reader slots available.
     */
    limit: number;

    /**
     * A map of currently acquired reader slot IDs to their expiration dates.
     * A null value indicates an indefinite slot with no expiration.
     * Iteration order is not guaranteed and should not be relied upon.
     */
    acquiredSlots: Map<string, Date | null>;
};

/**
 * Represents the combined persistent state of a shared lock in storage.
 * Contains both writer lock and reader semaphore state information.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockAdapterState = {
    /**
     * The current state of the writer lock, or null if no writer lock exists or it has expired.
     */
    writer: IWriterLockAdapterState | null;

    /**
     * The current state of the reader semaphore, or null if no reader semaphore exists or it has expired.
     */
    reader: IReaderSemaphoreAdapterState | null;
};

/**
 * Internal settings for shared lock acquisition operations.
 * This is used internally by the shared lock adapter implementations and should not be directly instantiated in application code.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type SharedLockAcquireSettings = {
    /**
     * The current execution context where operations are performed.
     */
    context: IReadableContext;

    /**
     * The unique identifier for this shared lock instance.
     */
    key: string;

    /**
     * The unique identifier for the lock holder (typically a lock or slot ID).
     * Used to track acquisition and prevent unauthorized release.
     */
    lockId: string;

    /**
     * Maximum number of concurrent holders for this lock; for reader flows this limits concurrent readers.
     */
    limit: number;

    /**
     * Time-to-live duration for the acquired lock.
     * `null` means the lock does not expire.
     */
    ttl: TimeSpan | null;
};

/**
 * Technology-agnostic adapter contract for managing distributed shared locks (reader-writer locks).
 * Implementations handle writer lock and reader semaphore acquisition, release, refresh, and state tracking independent of the underlying storage.
 * **Note:** This contract is low-level and typically not used directly - prefer {@link ISharedLockFactory | `ISharedLockFactory`} for shared lock usage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockAdapter = {
    /**
     * Attempts to acquire a writer lock for the specified key.
     * Succeeds only if no non-expired writer lock exists and no non-expired reader slots are held.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param lockId - Unique identifier for this acquirer (becomes the owner)
     * @param ttl - Time-to-live duration or null for indefinite locks
     * @returns Promise resolving to true if the writer lock was successfully acquired, false if already held by another owner
     */
    acquireWriter(
        context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean>;

    /**
     * Releases a writer lock if owned by the specified lockId.
     * Ownership verification prevents accidental release of locks held by others.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param lockId - Unique identifier of the lock owner
     * @returns Promise resolving to true if the writer lock was successfully released, false if not owned by lockId or doesn't exist
     */
    releaseWriter(
        context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean>;

    /**
     * Forcibly releases a writer lock regardless of ownership.
     * Used for emergency lock release or administrative cleanup.
     * Bypasses ownership verification for situations where the owner is unavailable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @returns Promise resolving to true if the writer lock existed and was released, false if the lock is already expired
     */
    forceReleaseWriter(
        context: IReadableContext,
        key: string,
    ): Promise<boolean>;

    /**
     * Refreshes (extends) the time-to-live of an existing writer lock.
     * Only succeeds if all conditions are met: ownership matches, lock hasn't expired, and it's expirable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param lockId - Unique identifier of the lock owner
     * @param ttl - New time-to-live duration to set
     * @returns Promise resolving to true if refresh succeeded, false if the lock is unexpirable, expired, or not owned by lockId
     */
    refreshWriter(
        context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean>;

    /**
     * Attempts to acquire a reader slot in the shared lock.
     * Succeeds only if no non-expired writer lock is held and the current number of acquired reader slots has not reached the limit.
     *
     * @param settings - Settings containing the context, key, lockId, limit, and ttl for the acquisition
     * @returns Promise resolving to true if the reader slot was successfully acquired, false if the slot limit has been reached
     */
    acquireReader(settings: SharedLockAcquireSettings): Promise<boolean>;

    /**
     * Releases a specific reader slot if it is currently acquired.
     * Only the holder of the slot (identified by slotId) can release it.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param slotId - Unique identifier of the reader slot to release
     * @returns Promise resolving to true if the reader slot was successfully released, false if the slot doesn't exist or is already released
     */
    releaseReader(
        context: IReadableContext,
        key: string,
        slotId: string,
    ): Promise<boolean>;

    /**
     * Forcibly releases all reader slots for the specified shared lock regardless of ownership.
     * Used for emergency cleanup or administrative operations.
     * Bypasses ownership verification for situations where individual slot holders are unavailable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @returns Promise resolving to true if reader slots existed and were released, false if no reader slots are acquired
     */
    forceReleaseAllReaders(
        context: IReadableContext,
        key: string,
    ): Promise<boolean>;

    /**
     * Refreshes (extends) the time-to-live of an existing reader slot.
     * Only succeeds if all conditions are met: the slot exists, hasn't expired, and is expirable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param slotId - Unique identifier of the reader slot to refresh
     * @param ttl - New time-to-live duration to set
     * @returns Promise resolving to true if refresh succeeded, false if the slot is unexpirable, expired, or doesn't exist
     */
    refreshReader(
        context: IReadableContext,
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean>;

    /**
     * Forcibly releases both the writer lock and all reader slots regardless of ownership.
     * Used for complete emergency cleanup of the shared lock.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @returns Promise resolving to true if the shared lock existed and was fully released, false if the shared lock doesn't exist
     */
    forceRelease(context: IReadableContext, key: string): Promise<boolean>;

    /**
     * Retrieves the current state of a shared lock.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @returns Promise resolving to the non-expired shared lock state if it exists; otherwise null for missing or expired shared locks
     */
    getState(
        context: IReadableContext,
        key: string,
    ): Promise<ISharedLockAdapterState | null>;
};

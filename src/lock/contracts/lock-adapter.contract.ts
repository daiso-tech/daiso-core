/**
 * @module Lock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type ILockFactory } from "@/lock/contracts/lock-factory.contract.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Represents the persistent state of a lock in storage.
 * Contains information about ownership and expiration time.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockAdapterState = {
    /**
     * The unique identifier of the entity that currently holds this lock.
     */
    owner: string;

    /**
     * The date and time when the lock expires and becomes available for others to acquire.
     * null indicates an indefinite lock with no expiration.
     */
    expiration: Date | null;
};

/**
 * Technology-agnostic adapter contract for managing distributed locks.
 * Implementations handle lock acquisition, release, refresh, and state tracking independent of the underlying storage.
 * **Note:** This contract is low-level and typically not used directly - prefer {@link ILockFactory | `ILockFactory`} for lock usage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockAdapter = {
    /**
     * Attempts to acquire a lock for the specified key.
     * Succeeds only if the lock is currently expired or doesn't exist.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @param lockId - Unique identifier for this acquirer (becomes the owner)
     * @param ttl - Time-to-live duration or null for indefinite locks
     * @returns Promise resolving to true if lock was successfully acquired, false if already held by another owner
     */
    acquire(
        context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean>;

    /**
     * Releases a lock if owned by the specified lockId.
     * Ownership verification prevents accidental release of locks held by others.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @param lockId - Unique identifier of the lock owner
     * @returns Promise resolving to true if lock was successfully released, false if not owned by lockId or doesn't exist
     */
    release(
        context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<boolean>;

    /**
     * Forcibly releases a lock regardless of ownership.
     * Used for emergency lock release or administrative cleanup.
     * Bypasses ownership verification for situations where the owner is unavailable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @returns Promise resolving to true if lock existed and was released, false if lock is already expired
     */
    forceRelease(context: IReadableContext, key: string): Promise<boolean>;

    /**
     * Refreshes (extends) the time-to-live of an existing lock.
     * Only succeeds if all conditions are met: ownership matches, lock hasn't expired, and it's expirable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @param lockId - Unique identifier of the lock owner
     * @param ttl - New time-to-live duration to set
     * @returns Promise resolving to true if refresh succeeded, false if lock is unexpirable, expired, or not owned by lockId
     */
    refresh(
        context: IReadableContext,
        key: string,
        lockId: string,
        ttl: TimeSpan,
    ): Promise<boolean>;

    /**
     * Retrieves the current state of a lock.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @returns Promise resolving to the non-expired lock state if it exists; otherwise null for missing or expired locks
     */
    getState(
        context: IReadableContext,
        key: string,
    ): Promise<ILockAdapterState | null>;
};

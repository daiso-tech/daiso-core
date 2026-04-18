/**
 * @module Lock
 */

import { type ILockState } from "@/lock/contracts/_module.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { type AsyncLazy } from "@/utilities/_module.js";

/**
 * State and metadata methods for a lock instance.
 * Provides read-only access to lock state and configuration properties.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockStateMethods = {
    /**
     * Retrieves the current state of the lock.
     *
     * @returns The current lock state (acquired, expired, unavailable, etc.)
     */
    getState(): Promise<ILockState>;

    /**
     * The unique identifier for the resource being locked.
     * Multiple lock instances with the same key cannot be held simultaneously by different owners.
     */
    readonly key: IKey;

    /**
     * The unique identifier for this lock holder (lock instance).
     * Used to identify who acquired the lock and prevent unauthorized release.
     */
    readonly id: string;

    /**
     * The time-to-live (TTL) duration before this lock automatically expires.
     * `null` indicates the lock does not expire and must be explicitly released.
     */
    readonly ttl: TimeSpan | null;
};

/**
 * Base operations for managing lock acquisition, release, and refresh cycles.
 * Provides both safe (boolean-returning) and strict (error-throwing) versions of lock operations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockBase = {
    /**
     * Executes an async function while holding the lock.
     * Automatically acquires the lock before execution and releases it after completion.
     * Throws an error if the lock cannot be acquired.
     *
     * @template TValue - The return type of the async function
     * @param asyncFn - The function to execute under lock
     * @returns The return value of the function
     * @throws {FailedAcquireLockError} If the lock is already held by a different owner
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * Attempts to acquire the lock if not already held by another owner.
     *
     * @returns true if lock was successfully acquired, false if already held by a different owner
     */
    acquire(): Promise<boolean>;

    /**
     * Acquires the lock if not already held by another owner.
     * Throws an error if the lock cannot be acquired.
     *
     * @throws {FailedAcquireLockError} If the lock is already held by a different owner
     */
    acquireOrFail(): Promise<void>;

    /**
     * Releases the lock if held by this owner.
     *
     * @returns true if lock was successfully released, false if not held by this owner
     */
    release(): Promise<boolean>;

    /**
     * Releases the lock if held by this owner.
     * Throws an error if the lock is not held by this owner.
     *
     * @throws {FailedReleaseLockError} If the lock is not held by this owner
     */
    releaseOrFail(): Promise<void>;

    /**
     * Forces lock release regardless of current owner.
     * Use with caution as it can break lock guarantees.
     *
     * @returns true if the lock existed and was released, false if lock does not exist
     */
    forceRelease(): Promise<boolean>;

    /**
     * Refreshes (extends) the lock's TTL if it is expirable and held by this owner.
     * Updates the expiration time to prevent the lock from timing out.
     *
     * @param ttl - New TTL duration. If not provided, uses the lock's original TTL
     * @returns true if lock was successfully refreshed, false if not held by this owner or unexpirable
     */
    refresh(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * Refreshes (extends) the lock's TTL if it is expirable and held by this owner.
     * Throws an error if the lock cannot be refreshed.
     *
     * @param ttl - New TTL duration. If not provided, uses the lock's original TTL
     * @throws {FailedRefreshLockError} If the lock is not held by this owner or is not expirable
     */
    refreshOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * High-level lock interface combining state methods and base operations.
 * Provides a complete distributed locking API for synchronizing resource access.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILock = ILockBase & ILockStateMethods;

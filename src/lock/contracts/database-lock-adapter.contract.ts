/**
 * @module Lock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * Represents expiration information for a lock.
 * Contains the date and time when the lock becomes available for acquisition.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockExpirationData = {
    /**
     * The date and time when the lock expires and becomes available for others to acquire.
     * null indicates the lock does not expire and is held indefinitely.
     */
    expiration: Date | null;
};

/**
 * Complete lock data including ownership and expiration information.
 * Represents the full state of a lock stored in a database.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockData = ILockExpirationData & {
    /**
     * The unique identifier of the entity that currently holds this lock.
     */
    owner: string;
};

/**
 * Transactional operations interface for lock state in database.
 * Used within database transactions to ensure atomic lock updates and consistency.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type IDatabaseLockTransaction = {
    /**
     * Retrieves the current lock data for a given key.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @returns Promise resolving to the lock's owner and expiration data if found, otherwise null
     */
    find(context: IReadableContext, key: string): Promise<ILockData | null>;

    /**
     * Creates a new lock record if it doesn't exist, or updates the existing one.
     * Used to persist the current owner and expiration state of a lock.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @param lockId - The unique identifier of the lock owner
     * @param expiration - The date and time when the lock expires, or null for indefinite locks
     * @returns Promise that resolves when the upsert operation completes
     */
    upsert(
        context: IReadableContext,
        key: string,
        lockId: string,
        expiration: Date | null,
    ): Promise<void>;
};

/**
 * Technology-agnostic storage adapter contract for lock persistence in databases.
 * Implementations handle lock data storage using CRUD-capable backends (SQL databases, ORMs like TypeORM/MikroORM, etc.).
 * Provides transactional support for atomic lock updates and consistency guarantees in distributed systems.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type IDatabaseLockAdapter = {
    /**
     * Executes the provided function within a database transaction.
     * Ensures atomicity of all lock operations (upsert, find) within the transaction.
     * Should use the strictest transaction isolation level to prevent race conditions.
     *
     * @template TReturn - The return type of the transaction function
     * @param context - Readable execution context for the operation
     * @param fn - Function to execute within the transaction, receives transaction object
     * @returns Promise resolving to the return value of the transaction function
     */
    transaction<TReturn>(
        context: IReadableContext,
        fn: InvokableFn<
            [transaction: IDatabaseLockTransaction],
            Promise<TReturn>
        >,
    ): Promise<TReturn>;

    /**
     * Removes a lock from the database regardless of its current owner.
     * Used for administrative cleanup or when the current owner is unavailable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @returns Promise resolving to the removed lock's expiration data if a lock existed, otherwise null
     */
    remove(
        context: IReadableContext,
        key: string,
    ): Promise<ILockExpirationData | null>;

    /**
     * Removes a lock from the database only if owned by the specified lockId.
     * Ownership verification prevents accidental deletion of locks held by others.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @param lockId - The unique identifier of the expected lock owner
     * @returns Promise resolving to the lock's owner and expiration data if successfully removed,
     *          null if the lock wasn't found or the owner didn't match
     */
    removeIfOwner(
        context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<ILockData | null>;

    /**
     * Updates the expiration time of a lock if owned by the specified lockId.
     * Ownership verification ensures only the lock owner can extend the lock.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @param lockId - The unique identifier of the expected lock owner
     * @param expiration - The new date and time when the lock should expire
     * @returns Promise resolving to the number of locks updated (1 if successful, 0 if not found or ownership mismatch)
     */
    updateExpiration(
        context: IReadableContext,
        key: string,
        lockId: string,
        expiration: Date,
    ): Promise<number>;

    /**
     * Retrieves the current lock data for a given key.
     * Used for querying lock state without modifying it.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the lock
     * @returns Promise resolving to the lock's owner and expiration data if found, otherwise null
     */
    find(context: IReadableContext, key: string): Promise<ILockData | null>;
};

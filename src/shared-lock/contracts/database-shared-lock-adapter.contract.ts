/**
 * @module SharedLock
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * Expiration tracking for a writer (exclusive) lock.
 * Contains the date and time when the lock expires.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLockExpirationData = {
    /**
     * The expiration date and time of the writer lock.
     * Null indicates the lock does not expire and is held indefinitely.
     * After this time, the lock is released automatically.
     */
    expiration: Date | null;
};

/**
 * Complete writer (exclusive) lock data including ownership and expiration.
 * Represents the full state of a write lock stored in a database.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLockData = IWriterLockExpirationData & {
    /**
     * Unique identifier of the entity currently holding the exclusive write lock.
     * Used for ownership verification before releasing or extending the lock.
     */
    owner: string;
};

/**
 * Expiration tracking for a reader (shared) semaphore slot.
 * Contains the date and time when the reader slot expires.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreSlotExpirationData = {
    /**
     * The expiration date and time of the reader semaphore slot.
     * Null indicates the slot does not expire automatically.
     * After this time, the slot is released and the reader count decrements.
     */
    expiration: Date | null;
};

/**
 * Complete reader semaphore slot including slot ID and expiration.
 * Represents a single reader occupying a slot in the reader semaphore.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreSlotData = IReaderSemaphoreSlotExpirationData & {
    /**
     * Unique identifier for this reader slot.
     * Generated when a reader acquires a slot, used for releasing or extending it.
     */
    id: string;
};

/**
 * Reader semaphore configuration persisted in the database.
 * Defines the maximum number of concurrent readers allowed.
 *
 * In shared lock patterns:
 * - Multiple readers can hold the lock simultaneously (up to limit)
 * - Only one writer can hold the lock exclusively (no readers allowed)
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreData = {
    /**
     * Maximum number of concurrent reader slots available.
     * Controls how many readers can access the resource simultaneously.
     */
    limit: number;
};

/**
 * Transaction context for writer (exclusive) lock operations.
 * Provides CRUD methods for managing write lock state within a database transaction.
 *
 * Writer locks are exclusive: only one entity can hold the lock at a time.
 * When a writer lock is held, no readers can acquire slots.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseWriterLockTransaction = {
    /**
     * Retrieves the current writer lock data for a given key.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @returns Lock data with owner and expiration if found, otherwise null
     */
    find(
        context: IReadableContext,
        key: string,
    ): Promise<IWriterLockData | null>;

    /**
     * Creates a new writer lock or updates the existing one.
     * Stores the lock owner and expiration state atomically.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param lockId - Unique identifier of the lock owner/acquirer
     * @param expiration - When the lock expires, or null for indefinite
     */
    upsert(
        context: IReadableContext,
        key: string,
        lockId: string,
        expiration: Date | null,
    ): Promise<void>;

    /**
     * Removes the writer lock regardless of current owner.
     * Used for administrative cleanup or forced unlock.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock to remove
     * @returns Expiration data of the removed lock, or null if not found
     */
    remove(
        context: IReadableContext,
        key: string,
    ): Promise<IWriterLockExpirationData | null>;

    /**
     * Removes the writer lock only if owned by the specified lock ID.
     * Ensures only the lock holder can release it.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param lockId - Expected owner's lock identifier
     * @returns Lock data if successfully removed, null if not found or owner mismatch
     */
    removeIfOwner(
        context: IReadableContext,
        key: string,
        lockId: string,
    ): Promise<IWriterLockData | null>;

    /**
     * Extends the writer lock expiration if owned by the specified lock ID.
     * Refreshes the lock hold period (heartbeat/keep-alive).
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the shared lock
     * @param lockId - Expected owner's lock identifier
     * @param expiration - New expiration time
     * @returns Number >= 1 if updated, 0 if not found or owner mismatch
     */
    updateExpiration(
        context: IReadableContext,
        key: string,
        lockId: string,
        expiration: Date,
    ): Promise<number>;
};

/**
 * Transaction context for reader (shared) semaphore operations.
 * Provides methods to manage reader slots within a database transaction.
 *
 * Reader semaphores allow multiple concurrent readers (up to limit).
 * Each reader occupies a "slot" identified by a unique slot ID.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseReaderSemaphoreTransaction = {
    /**
     * Retrieves the reader semaphore configuration (limit) for a given key.
     *
     * @param context - Readable execution context for the operation
     * @param key - The shared lock identifier
     * @returns Semaphore config with limit, or null if not found
     */
    findSemaphore(
        context: IReadableContext,
        key: string,
    ): Promise<IReaderSemaphoreData | null>;

    /**
     * Retrieves all reader slots for a given shared lock.
     * Returns empty array if no readers or shared lock doesn't exist.
     * Includes expired slots until they are explicitly removed.
     *
     * @param context - Readable execution context for the operation
     * @param key - The shared lock identifier
     * @returns  Array of reader slot data with IDs and expirations
     */
    findSlots(
        context: IReadableContext,
        key: string,
    ): Promise<Array<IReaderSemaphoreSlotData>>;

    /**
     * Creates or updates the reader semaphore configuration.
     * Sets the maximum number of concurrent readers allowed.
     *
     * @param context - Readable execution context for the operation
     * @param key - The shared lock identifier
     * @param limit - Maximum concurrent reader slots
     */
    upsertSemaphore(
        context: IReadableContext,
        key: string,
        limit: number,
    ): Promise<void>;

    /**
     * Creates or updates a reader slot within the semaphore.
     * Called when a reader acquires a slot.
     *
     * @param context - Readable execution context for the operation
     * @param key - The shared lock identifier
     * @param lockId - Unique identifier for this reader slot
     * @param expiration - When the slot expires, or null for indefinite
     */
    upsertSlot(
        context: IReadableContext,
        key: string,
        lockId: string,
        expiration: Date | null,
    ): Promise<void>;

    /**
     * Removes a specific reader slot, releasing it for other readers.
     *
     * @param context - Readable execution context for the operation
     * @param key - The shared lock identifier
     * @param slotId - The reader slot identifier to remove
     * @returns Expiration data of the removed slot, or null if not found
     */
    removeSlot(
        context: IReadableContext,
        key: string,
        slotId: string,
    ): Promise<IReaderSemaphoreSlotExpirationData | null>;

    /**
     * Removes all reader slots for a given shared lock.
     * Used for cleanup or reset operations.
     *
     * @param context - Readable execution context for the operation
     * @param key - The shared lock identifier
     * @returns Array of expiration data for all removed slots
     */
    removeAllSlots(
        context: IReadableContext,
        key: string,
    ): Promise<Array<IReaderSemaphoreSlotExpirationData>>;

    /**
     * Extends a reader slot's expiration if it hasn't expired yet.
     * Heartbeat/keep-alive mechanism for long-running readers.
     *
     * @param context - Readable execution context for the operation
     * @param key - The shared lock identifier
     * @param slotId - The reader slot identifier to extend
     * @param expiration - New expiration time
     * @returns Number > 0 if updated, 0 if slot not found or already expired
     */
    updateExpiration(
        context: IReadableContext,
        key: string,
        slotId: string,
        expiration: Date,
    ): Promise<number>;
};

/**
 * Combined transaction context providing both reader semaphore and writer lock operations.
 * Groups reader and writer operations under a single transaction for atomicity.
 *
 * In a shared (reader-writer) lock:
 * - `reader`: Manages concurrent reader slots (shared access)
 * - `writer`: Manages exclusive writer lock (exclusive access)
 * Both must be checked atomically to prevent race conditions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseSharedLockTransaction = {
    /**
     * Reader semaphore transaction for managing shared (read) access slots.
     * Multiple readers can hold slots simultaneously up to the configured limit.
     */
    reader: IDatabaseReaderSemaphoreTransaction;

    /**
     * Writer lock transaction for managing exclusive (write) access.
     * Only one writer can hold the lock at a time, blocking all readers.
     */
    writer: IDatabaseWriterLockTransaction;
};

/**
 * Database adapter contract for implementing shared (reader-writer) locks in SQL/document databases.
 * Simplifies shared lock implementation using transactional CRUD patterns.
 *
 * Shared locks implement the reader-writer pattern:
 * - **Readers** (shared): Multiple concurrent readers allowed (semaphore-based)
 * - **Writers** (exclusive): Only one writer at a time, blocks all readers
 *
 * Designed for persistent shared locks stored in databases like:
 * - SQL databases (PostgreSQL, MySQL) with TypeORM or MikroORM
 * - Document databases with transaction support
 *
 * Key design:
 * - All operations run within a single transaction for atomicity
 * - Uses strict transaction isolation to prevent race conditions
 * - Reader count managed via semaphore slots
 * - Writer managed via exclusive lock ownership
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseSharedLockAdapter = {
    /**
     * Executes a function within a database transaction providing both reader and writer operations.
     * Ensures atomicity of all shared lock operations within the transaction.
     *
     * Implementations must use the strictest transaction isolation level available
     * to prevent race conditions between concurrent readers and writers.
     *
     * @template TReturn - Return type of the transaction function
     * @param context - Readable execution context for the operation
     * @param fn - Async function receiving combined reader/writer transaction object
     * @returns The value returned by the transaction function
     * @throws Error if transaction fails or is rolled back
     */
    transaction<TReturn>(
        context: IReadableContext,
        fn: InvokableFn<
            [transaction: IDatabaseSharedLockTransaction],
            Promise<TReturn>
        >,
    ): Promise<TReturn>;
};

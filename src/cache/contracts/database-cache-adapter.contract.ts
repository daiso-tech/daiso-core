/**
 * @module Cache
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * Cached value with expiration tracking.
 * Represents a single cache entry stored in the database.
 *
 * @template TType - The type of data being cached (defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheData<TType = unknown> = {
    /**
     * The cached value.
     * Stored data at rest, retrieved on cache hit.
     */
    value: TType;

    /**
     * When this cache entry expires and should be deleted.
     * Null means the entry never expires automatically.
     * After this time, the entry is considered invalid and should not be used.
     */
    expiration: Date | null;
};

/**
 * Transaction context for atomic cache operations.
 * Provides methods to read and modify cache state within a database transaction.
 *
 * All transaction methods run atomically:
 * - Multiple operations execute as a single unit
 * - Either all succeed or all fail together
 * - No partial updates visible to other transactions
 *
 * @template TType - The type of data managed by this cache (defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type IDatabaseCacheTransaction<TType = unknown> = {
    /**
     * Retrieves a cached value by key.
     * Returns the value and expiration info, or null if not found.
     *
     * @param context - Readable execution context for the operation
     * @param key - The cache key identifier
     * @returns Cache data with value and expiration, or null if not found
     */
    find(
        context: IReadableContext,
        key: string,
    ): Promise<ICacheData<TType> | null>;

    /**
     * Creates or updates a cache entry with optional expiration.
     * Sets (upserts) the value at the key, overwriting any existing entry.
     *
     * @param context - Readable execution context for the operation
     * @param key - The cache key identifier
     * @param value - The value to cache
     * @param expiration - When the cache entry should expire (optional, null = never expires)
     * @returns Void (always succeeds)
     */
    upsert(
        context: IReadableContext,
        key: string,
        value: TType,
        expiration?: Date | null,
    ): Promise<void>;
};

/**
 * Expiration information for a cache entry.
 * Lightweight version of ICacheData containing only expiration metadata.
 * Returned by operations that modify cache (update, remove) to indicate expiration state.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheDataExpiration = {
    /**
     * When this cache entry expired or will expire.
     * Null indicates the entry had no expiration (persisted indefinitely).
     * Useful for understanding cache timing in update/remove operations.
     */
    expiration: Date | null;
};

/**
 * Database cache adapter contract for implementing cache persistence in SQL/document databases.
 * Simplifies cache adapter development using transactional CRUD patterns.
 *
 * Suitable for:
 * - SQL databases (PostgreSQL, MySQL) with TypeORM or MikroORM
 * - Document databases with transaction support
 * - Any backend with atomic transaction capability and CRUD operations
 *
 * The adapter handles:
 * - Key-value cache storage with expiration tracking
 * - Atomic transactions for consistency
 * - Batch operations (remove many, remove by prefix)
 * - Cache expiration management
 *
 * @template TType - The type of values cached (defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type IDatabaseCacheAdapter<TType = unknown> = {
    /**
     * Retrieves a cached value by key.
     * Returns the complete cache entry with value and expiration, or null if not found.
     *
     * @param context - Readable execution context for the operation
     * @param key - The cache key identifier
     * @returns Cache entry with value and expiration, or null if not found.
     */
    find(
        context: IReadableContext,
        key: string,
    ): Promise<ICacheData<TType> | null>;

    /**
     * Executes a function within a database transaction.
     * Ensures all cache operations in the function are atomic and isolated.
     *
     * @template TValue - Return type of the transaction function
     * @param context - Readable execution context for the operation
     * @param trxFn - Async function receiving transaction object, returns value of any type
     * @returns The value returned by the transaction function
     * @throws Error if transaction fails or is rolled back
     */
    transaction<TValue>(
        context: IReadableContext,
        trxFn: InvokableFn<
            [trx: IDatabaseCacheTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue>;

    /**
     * Updates the value for an existing cache key.
     * Returns null if the key doesn't exist (use upsert for auto-create).
     *
     * @param context - Readable execution context for the operation
     * @param key - The cache key to update
     * @param value - The new value to cache
     * @returns Expiration info of the updated entry, or null if key not found
     */
    update(
        context: IReadableContext,
        key: string,
        value: TType,
    ): Promise<ICacheDataExpiration | null>;

    /**
     * Removes multiple specific cache entries by key.
     * Silently ignores missing keys.
     *
     * @param context - Readable execution context for the operation
     * @param keys - Array of cache key identifiers to delete
     * @returns Array of expiration info for all removed entries
     */
    removeMany(
        context: IReadableContext,
        keys: Array<string>,
    ): Promise<Array<ICacheDataExpiration>>;

    /**
     * Removes all entries from the cache.
     * Complete cache flush operation.
     *
     * @param context - Readable execution context for the operation
     * @returns Void (always succeeds)
     */
    removeAll(context: IReadableContext): Promise<void>;

    /**
     * Removes all cache entries whose keys start with the given prefix.
     * Useful for clearing related cache entries (e.g., all user data: "user:*").
     *
     * @param context - Readable execution context for the operation
     * @param prefix - Key prefix to match (e.g., "user:123:" for all data for user 123)
     * @returns Void (always succeeds)
     */
    removeByKeyPrefix(context: IReadableContext, prefix: string): Promise<void>;
};

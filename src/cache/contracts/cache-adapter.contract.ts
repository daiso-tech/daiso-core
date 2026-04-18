/**
 * @module Cache
 */
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Low-level adapter contract for cache storage operations.
 * Defines CRUD operations for key-value pairs with expiration support.
 * This contract abstracts away the underlying cache storage technology (Redis, Memcached, database, etc.).
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheAdapter<TType = unknown> = {
    /**
     * Retrieves a value by key without removing it.
     *
     * @param context - Readable execution context for the operation
     * @param key - Cache key to retrieve
     * @returns The cached value, or null if not found or expired
     */
    get(context: IReadableContext, key: string): Promise<TType | null>;

    /**
     * Retrieves a value by key and immediately removes it.
     * Useful for one-time-use values (tokens, temporary states, etc.).
     *
     * @param context - Readable execution context for the operation
     * @param key - Cache key to retrieve and remove
     * @returns The cached value, or null if not found or expired
     */
    getAndRemove(context: IReadableContext, key: string): Promise<TType | null>;

    /**
     * Creates a new cache entry, but only if the key does not already exist.
     * Has no effect if the key already exists.
     *
     * @param context - Readable execution context for the operation
     * @param key - Cache key to add
     * @param value - Value to cache
     * @param ttl - Time-to-live duration for this entry. Pass `null` to cache without expiration.
     * @returns true if the entry was created, false if the key already existed
     */
    add(
        context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean>;

    /**
     * Creates a new cache entry or updates an existing one (upsert).
     * Also updates the TTL when overwriting an existing entry.
     *
     * @param context - Readable execution context for the operation
     * @param key - Cache key to set
     * @param value - Value to cache
     * @param ttl - Time-to-live duration for this entry. Pass `null` to cache without expiration.
     * @returns true if the entry was added, false if it was updated
     */
    put(
        context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean>;

    /**
     * Updates an existing cache entry without changing its TTL.
     * Has no effect if the key does not exist.
     *
     * @param context - Readable execution context for the operation
     * @param key - Cache key to update
     * @param value - New value to cache
     * @returns true if the entry was updated, false if the key did not exist
     */
    update(
        context: IReadableContext,
        key: string,
        value: TType,
    ): Promise<boolean>;

    /**
     * Increments a numeric cache entry by a given amount.
     * Useful for counters, rates, and statistics.
     *
     * @param context - Readable execution context for the operation
     * @param key - Cache key to increment
     * @param value - Amount to increment by.
     * @returns true if the entry was incremented, false if the key did not exist
     * @throws {TypeError} If the cached value is not a number
     */
    increment(
        context: IReadableContext,
        key: string,
        value: number,
    ): Promise<boolean>;

    /**
     * Removes multiple cache entries at once.
     *
     * @param context - Readable execution context for the operation
     * @param keys - Array of cache keys to remove
     * @returns true if at least one key was removed, false if none existed
     */
    removeMany(
        context: IReadableContext,
        keys: Array<string>,
    ): Promise<boolean>;

    /**
     * Removes all cache entries.
     * Use with caution as this completely clears the cache.
     *
     * @param context - Readable execution context for the operation
     */
    removeAll(context: IReadableContext): Promise<void>;

    /**
     * Removes all cache entries whose keys start with a given prefix.
     * Useful for invalidating groups of related cache entries.
     *
     * @param context - Readable execution context for the operation
     * @param prefix - Key prefix to match for removal
     */
    removeByKeyPrefix(context: IReadableContext, prefix: string): Promise<void>;
};

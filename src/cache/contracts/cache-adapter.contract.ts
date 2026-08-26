/**
 * @module Cache
 */

import type { InvocableFn, Promisable } from "@/utilities/_module.js";

/**
 * Low-level adapter contract for cache storage operations.
 * Defines CRUD operations for key-value pairs with expiration support.
 * This contract abstracts away the underlying cache storage technology (Redis, Memcached, database, etc.).
 *
 * IMPORT_PATH: `"eridu-tech/cache/contracts"`
 * @group Contracts
 */
export type ICacheAdapter<TType = unknown> = {
    /**
     * Retrieves a value by key without removing it.
     *
     * @param key - Cache key to retrieve
     * @returns The cached value, or null if not found or expired
     */
    get(key: string): Promise<TType | null>;

    /**
     * Retrieves a value by key and immediately removes it.
     * Useful for one-time-use values (tokens, temporary states, etc.).
     *
     * @param key - Cache key to retrieve and remove
     * @returns The cached value, or null if not found or expired
     */
    getAndRemove(key: string): Promise<TType | null>;

    /**
     * Creates a new cache entry, but only if the key does not already exist.
     * Has no effect if the key already exists.
     *
     * @param key - Cache key to add
     * @param value - Value to cache
     * @param ttl - Time-to-live duration for this entry. Pass `null` to cache without expiration.
     * @returns true if the entry was created, false if the key already existed
     */
    add(key: string, value: TType, ttl: Date | null): Promise<boolean>;

    /**
     * The `getOrAdd` method retrieves the value for the given `key` if it exists,
     * otherwise it evaluates `valueToAdd`, stores the result in the cache, and returns it.
     *
     * The `valueToAdd` can be a plain value or an invocable function that lazily produces
     * the value to cache. When a function is provided, it is invoked only when the key is
     * missing (or expired) and may return the value directly or as a promise.
     *
     * @param key - The cache key to retrieve or add.
     * @param valueToAdd - The value to store if the key is not found, or a function that lazily produces it.
     * @param ttl - Optional time-to-live for the cached item. If `null` is passed, the item will not expire.
     *
     * @returns The cached value if the key exists, or the newly added value.
     */
    getOrAdd(
        key: string,
        valueToAdd: TType | InvocableFn<[], Promisable<TType>>,
        ttl: Date | null,
    ): Promise<TType>;

    /**
     * Creates a new cache entry or updates an existing one (upsert).
     * Also updates the TTL when overwriting an existing entry.
     *
     * @param key - Cache key to set
     * @param value - Value to cache
     * @param ttl - Time-to-live duration for this entry. Pass `null` to cache without expiration.
     * @returns true if the entry was added, false if it was updated
     */
    put(key: string, value: TType, ttl: Date | null): Promise<boolean>;

    /**
     * Updates an existing cache entry without changing its TTL.
     * Has no effect if the key does not exist.
     *
     * @param key - Cache key to update
     * @param value - New value to cache
     * @returns true if the entry was updated, false if the key did not exist
     */
    update(key: string, value: TType): Promise<boolean>;

    /**
     * Increments a numeric cache entry by a given amount.
     * Useful for counters, rates, and statistics.
     *
     * @param key - Cache key to increment
     * @param value - Amount to increment by.
     *
     * @returns true if the entry was incremented, false if the key did not exist
     * @throws {TypeError} If the cached value is not a number
     */
    increment(key: string, value: number): Promise<boolean>;

    /**
     * Removes multiple cache entries at once.
     *
     * @param keys - Array of cache keys to remove
     *
     * @returns true if at least one key was removed, false if none existed
     */
    removeMany(keys: Array<string>): Promise<boolean>;

    /**
     * Removes all cache entries whose keys start with a given prefix.
     * Useful for invalidating groups of related cache entries.
     *
     * @param prefix - Key prefix to match for removal
     */
    removeByPrefix(prefix: string): Promise<void>;
};

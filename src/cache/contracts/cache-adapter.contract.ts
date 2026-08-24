/**
 * @module Cache
 */
import type { IReadableContext } from "@/execution-context/contracts/_module.js";

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
     * @param context - Readable execution context for the operation
     * @returns The cached value, or null if not found or expired
     */
    get(key: string, context: IReadableContext): Promise<TType | null>;

    /**
     * Retrieves a value by key and immediately removes it.
     * Useful for one-time-use values (tokens, temporary states, etc.).
     *
     * @param key - Cache key to retrieve and remove
     * @param context - Readable execution context for the operation
     * @returns The cached value, or null if not found or expired
     */
    getAndRemove(key: string, context: IReadableContext): Promise<TType | null>;

    /**
     * Creates a new cache entry, but only if the key does not already exist.
     * Has no effect if the key already exists.
     *
     * @param key - Cache key to add
     * @param value - Value to cache
     * @param ttl - Time-to-live duration for this entry. Pass `null` to cache without expiration.
     * @param context - Readable execution context for the operation
     * @returns true if the entry was created, false if the key already existed
     */
    add(
        key: string,
        value: TType,
        ttl: Date | null,
        context: IReadableContext,
    ): Promise<boolean>;

    /**
     * The `getOrAdd` method retrieves the value for the given `key` if it exists,
     * otherwise adds the `valueToAdd` to the cache and returns it.
     *
     * @param key - The cache key to retrieve or add.
     * @param valueToAdd - The value to store if the key is not found.
     * @param ttl - Optional time-to-live for the cached item. If `null` is passed, the item will not expire.
     * @param context - Readable execution context for the operation
     *
     * @returns The cached value if the key exists, or the newly added value.
     */
    getOrAdd(
        key: string,
        valueToAdd: TType,
        ttl: Date | null,
        context: IReadableContext,
    ): Promise<TType>;

    /**
     * Creates a new cache entry or updates an existing one (upsert).
     * Also updates the TTL when overwriting an existing entry.
     *
     * @param key - Cache key to set
     * @param value - Value to cache
     * @param ttl - Time-to-live duration for this entry. Pass `null` to cache without expiration.
     * @param context - Readable execution context for the operation
     * @returns true if the entry was added, false if it was updated
     */
    put(
        key: string,
        value: TType,
        ttl: Date | null,
        context: IReadableContext,
    ): Promise<boolean>;

    /**
     * Updates an existing cache entry without changing its TTL.
     * Has no effect if the key does not exist.
     *
     * @param key - Cache key to update
     * @param value - New value to cache
     * @param context - Readable execution context for the operation
     * @returns true if the entry was updated, false if the key did not exist
     */
    update(
        key: string,
        value: TType,
        context: IReadableContext,
    ): Promise<boolean>;

    /**
     * Increments a numeric cache entry by a given amount.
     * Useful for counters, rates, and statistics.
     *
     * @param key - Cache key to increment
     * @param value - Amount to increment by.
     * @param context - Readable execution context for the operation
     *
     * @returns true if the entry was incremented, false if the key did not exist
     * @throws {TypeError} If the cached value is not a number
     */
    increment(
        key: string,
        value: number,
        context: IReadableContext,
    ): Promise<boolean>;

    /**
     * Removes multiple cache entries at once.
     *
     * @param keys - Array of cache keys to remove
     * @param context - Readable execution context for the operation
     *
     * @returns true if at least one key was removed, false if none existed
     */
    removeMany(
        keys: Array<string>,
        context: IReadableContext,
    ): Promise<boolean>;

    /**
     * Removes all cache entries whose keys start with a given prefix.
     * Useful for invalidating groups of related cache entries.
     *
     * @param prefix - Key prefix to match for removal
     * @param context - Readable execution context for the operation
     */
    removeByPrefix(prefix: string, context: IReadableContext): Promise<void>;
};

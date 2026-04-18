/**
 * @module Cache
 */

import { type CacheEventMap } from "@/cache/contracts/cache.events.js";
import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Invokable,
    type AsyncLazyable,
    type NoneFunc,
} from "@/utilities/_module.js";

/**
 * The `ICacheListenable` contract provides a way to listen to cache operation events and track state changes.
 * Subscribe to cache events to monitor entry additions, retrievals, updates, evictions, and expirations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheListenable<TType = unknown> = IEventListenable<
    CacheEventMap<TType>
>;

/**
 * Configuration settings for cache write operations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type CacheWriteSettings = {
    /**
     * Time-to-live (TTL) duration for cached entries.
     * When set, entries will automatically expire after this duration.
     * Pass `null` to cache entries without automatic expiration.
     */
    ttl?: ITimeSpan | null;

    /**
     * Random jitter factor (0-1) to add variance to expiration times.
     * Prevents thundering herd problems when many entries expire simultaneously.
     * A value of 0.1 adds ±10% randomness to the TTL.
     */
    jitter?: number;

    /**
     * Used internally for testing to control random number generation.
     *
     * @internal
     */
    _mathRandom?: () => number;
};

/**
 * The `IReadableCache` contract defines a read-only interface for accessing cached key-value pairs.
 * It provides methods to retrieve values independent of the underlying cache storage backend (Redis, Memcached, database, etc.).
 * Use this contract when you need read-only access to cache data without mutation capabilities.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type IReadableCache<TType = unknown> = {
    /**
     * Checks if a key exists in the cache.
     *
     * @param key - The cache key to check
     * @returns true if the key exists, false otherwise
     */
    exists(key: string): Promise<boolean>;

    /**
     * Checks if a key does not exist in the cache.
     *
     * @param key - The cache key to check
     * @returns true if the key is missing, false if it exists
     */
    missing(key: string): Promise<boolean>;

    /**
     * Retrieves a cached value by key.
     *
     * @param key - The cache key to retrieve
     * @returns The cached value, or null if the key is not found or has expired
     */
    get(key: string): Promise<TType | null>;

    /**
     * Retrieves a cached value by key, throwing an error if not found.
     *
     * @param key - The cache key to retrieve
     * @returns The cached value
     * @throws {KeyNotFoundCacheError} If the key is not found or has expired
     */
    getOrFail(key: string): Promise<TType>;

    /**
     * Retrieves a cached value with a default fallback.
     *
     * @param key - The cache key to retrieve
     * @param defaultValue - Default value to return if key is not found. Can be a static value, sync function, or async function.
     * @returns The cached value, or the default value if the key is not found
     */
    getOr(
        key: string,
        defaultValue: AsyncLazyable<NoneFunc<TType>>,
    ): Promise<TType>;
};

/**
 * Configuration settings for cache get-or-add operations.
 * Extends {@link CacheWriteSettings | `CacheWriteSettings`} to support atomic read-compute-write patterns.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type GetOrAddSettings = CacheWriteSettings & {
    /**
     * Enable distributed locking for the get-or-add operation.
     * When enabled, uses a lock to ensure only one client computes and caches the value,
     * preventing cache stampedes when multiple clients request the same missing key.
     *
     * @default false
     */
    enableLocking?: boolean;
};

/**
 * The `ICacheBase` contract defines a way for storing and reading as key-value pairs independent of data storage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheBase<TType = unknown> = IReadableCache<TType> & {
    /**
     * The `getAndRemove` method returns the value when `key` is found otherwise null will be returned.
     * The key will be removed after it is returned.
     */
    getAndRemove(key: string): Promise<TType | null>;

    /**
     * The `getOrAdd` method will retrieve the given `key` if found otherwise `valueToAdd` will be added and returned.
     *
     * @param valueToAdd - can be regular value, sync or async {@link Invokable | `Invokable`} value and {@link Promise | `Promise`} value.
     */
    getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<NoneFunc<TType>>,
        settings?: GetOrAddSettings,
    ): Promise<TType>;

    /**
     * The `add` method adds a `key` with given `value` when key doesn't exists.
     *
     * @param settings.ttl - If null is passed, the item will not expire.
     *
     * @returns Returns true when key doesn't exists otherwise false will be returned.
     */
    add(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<boolean>;

    /**
     * The `addOrFail` method adds a `key` with given `value` when key doesn't exists.
     * Throws an error if the `key` exists.
     *
     * @throws {KeyExistsCacheError}
     */
    addOrFail(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<void>;

    /**
     * The `put` methods upsert the given key and replaces the ttl when updated.
     *
     * @param settings.ttl - If null is passed, the item will not expire.
     *
     * @returns Returns true if the `key` where replaced otherwise false is returned.
     */
    put(
        key: string,
        value: TType,
        settings?: CacheWriteSettings,
    ): Promise<boolean>;

    /**
     * The `update` method updates the given `key` with given `value`.
     *
     * @returns Returns true if the `key` where updated otherwise false will be returned.
     */
    update(key: string, value: TType): Promise<boolean>;

    /**
     * The `updateOrFail` method updates the given `key` with given `value`.
     * Thorws error if the `key` is not found.
     *
     * @throws {KeyNotFoundCacheError}
     */
    updateOrFail(key: string, value: TType): Promise<void>;

    /**
     * The `increment` method increments the given `key` with given `value`.
     * An error will thrown if the value is not a number.
     *
     * @param value - If not defined then it will be defaulted to 1.
     *
     * @returns Returns true if the `key` where incremented otherwise false will be returned.
     *
     * @throws {TypeError}
     */
    increment(key: string, value?: Extract<TType, number>): Promise<boolean>;

    /**
     * The `incrementOrFail` method increments the given `key` with given `value`.
     * An error will thrown if the value is not a number or if the key is not found.
     *
     * @param value - If not defined then it will be defaulted to 1.
     *
     * @throws {KeyNotFoundCacheError}
     * @throws {TypeError}
     */
    incrementOrFail(key: string, value?: Extract<TType, number>): Promise<void>;

    /**
     * The `decrement` method decrements the given `key` with given `value`.
     * An error will thrown if the value is not a number.
     *
     * @param value - If not defined then it will be defaulted to 1.
     *
     * @returns Returns true if the `key` where decremented otherwise false will be returned.
     *
     * @throws {TypeError}
     */
    decrement(key: string, value?: Extract<TType, number>): Promise<boolean>;

    /**
     * The `decrementOrFail` method decrements the given `key` with given `value`.
     * An error will thrown if the value is not a number or if the key is not found.
     *
     * @param value - If not defined then it will be defaulted to 1.
     *
     * @throws {KeyNotFoundCacheError}
     * @throws {TypeError}
     */
    decrementOrFail(key: string, value?: Extract<TType, number>): Promise<void>;

    /**
     * The `remove` method removes the given `key`.
     *
     * @returns Returns true if the key is found otherwise false is returned.
     */
    remove(key: string): Promise<boolean>;

    /**
     * The `removeOrFail` method removes the given `key`.
     * Throws an error if the key is not found.
     *
     * @throws {KeyNotFoundCacheError}
     */
    removeOrFail(key: string): Promise<void>;

    /**
     * The `removeMany` method removes many keys.
     *
     * @param keys - The param items can be a string or an `Iterable` of strings.
     * If the param items are an `Iterable`, it will be joined into a single string.
     * Think of an `Iterable` as representing a path.
     *
     * @returns Returns true if one of the keys where deleted otherwise false is returned.
     */
    removeMany(keys: Iterable<string>): Promise<boolean>;

    /**
     * The `clear` method removes all the keys in the cache. If a cache is in a group then only the keys part of the group will be removed.
     */
    clear(): Promise<void>;
};

/**
 * The `ICache` contract defines a way for as key-value pairs independent of data storage and listening to operation events.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICache<TType = unknown> = ICacheBase<TType> & {
    readonly events: ICacheListenable<TType>;
};

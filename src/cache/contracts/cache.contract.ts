/**
 * @module Cache
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    KeyExistsCacheError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    KeyNotFoundCacheError,
} from "@/cache/contracts/cache.errors.js";
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
 * The `ICacheListenable` contract defines a way for listening {@link ICache | `ICache`} operation events.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheListenable<TType = unknown> = IEventListenable<
    CacheEventMap<TType>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type CacheWriteSettings = {
    ttl?: ITimeSpan | null;
    jitter?: number;

    /**
     * Used internally for testin.
     *
     * @internal
     */
    _mathRandom?: () => number;
};

/**
 * The `IReadableCache` contract defines a way reading for as key-value pairs independent of data storage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type IReadableCache<TType = unknown> = {
    /**
     * The `exists` method returns true when `key` is found otherwise false will be returned.
     */
    exists(key: string): Promise<boolean>;

    /**
     * The `missing` method returns true when `key` is not found otherwise false will be returned.
     */
    missing(key: string): Promise<boolean>;

    /**
     * The `get` method returns the value when `key` is found otherwise null will be returned.
     */
    get(key: string): Promise<TType | null>;

    /**
     * The `getOrFail` method returns the value when `key` is found otherwise an error will be thrown.
     *
     * @throws {KeyNotFoundCacheError} {@link KeyNotFoundCacheError}
     */
    getOrFail(key: string): Promise<TType>;

    /**
     * The `getOr` method will retrieve the given `key` if found otherwise `defaultValue` will be returned.
     *
     * @param defaultValue - can be regular value, sync or async {@link Invokable | `Invokable`} value and {@link Promise | `Promise`} value.
     */
    getOr(
        key: string,
        defaultValue: AsyncLazyable<NoneFunc<TType>>,
    ): Promise<TType>;
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
        settings?: CacheWriteSettings,
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
     * @throws {KeyExistsCacheError} {@link KeyExistsCacheError}
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
     * @throws {KeyNotFoundCacheError} {@link KeyNotFoundCacheError}
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
     * @throws {TypeError} {@link TypeError}
     */
    increment(key: string, value?: Extract<TType, number>): Promise<boolean>;

    /**
     * The `incrementOrFail` method increments the given `key` with given `value`.
     * An error will thrown if the value is not a number or if the key is not found.
     *
     * @param value - If not defined then it will be defaulted to 1.
     *
     * @throws {KeyNotFoundCacheError} {@link KeyNotFoundCacheError}
     * @throws {TypeError} {@link TypeError}
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
     * @throws {TypeError} {@link TypeError}
     */
    decrement(key: string, value?: Extract<TType, number>): Promise<boolean>;

    /**
     * The `decrementOrFail` method decrements the given `key` with given `value`.
     * An error will thrown if the value is not a number or if the key is not found.
     *
     * @param value - If not defined then it will be defaulted to 1.
     *
     * @throws {KeyNotFoundCacheError} {@link KeyNotFoundCacheError}
     * @throws {TypeError} {@link TypeError}
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
     * @throws {KeyNotFoundCacheError} {@link KeyNotFoundCacheError}
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

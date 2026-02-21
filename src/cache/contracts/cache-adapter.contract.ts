/**
 * @module Cache
 */
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * The `ICacheAdapter` contract defines a way for storing key-value pairs with expiration independent of data storage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheAdapter<TType = unknown> = {
    /**
     * The `get` method returns the value when `key` is found otherwise null will be returned.
     */
    get(key: string): Promise<TType | null>;

    /**
     * The `getAndRemove` method returns the value when `key` is found otherwise null will be returned.
     * The key will be removed after it is returned.
     */
    getAndRemove(key: string): Promise<TType | null>;

    /**
     * The `add` method adds a `value` when `key` doesn't exists. Returns `true` when key doesn't exists otherwise `false` will be returned.
     * You can provide a `ttl` value. If null is passed, the item will not expire.
     */
    add(key: string, value: TType, ttl: TimeSpan | null): Promise<boolean>;

    /**
     * The `put` method replaces the given `key` with the given `value` and `ttl` if the `key` exists othwerwise it will add the given `value` and `ttl`.
     * Returns `true` if the `key` where replaced otherwise `false` is returned.
     */
    put(key: string, value: TType, ttl: TimeSpan | null): Promise<boolean>;

    /**
     * The `update` method updates the given `key` with given `value`. Returns `true` if the `key` where updated otherwise `false` will be returned.
     */
    update(key: string, value: TType): Promise<boolean>;

    /**
     * The `increment` method increments the given `key` with given `value`. Returns `true` if the `key` where incremented otherwise `false` will be returned.
     * If `values` is not defined then it will increment the key with 1.
     * An error will thrown if the key is not a number.
     * @throws {TypeError} {@link TypeError}
     */
    increment(key: string, value: number): Promise<boolean>;

    /**
     * The `removeMany` method removes many keys. Returns `true` if one of the keys where deleted otherwise `false` is returned.
     */
    removeMany(keys: Array<string>): Promise<boolean>;

    /**
     * The `removeAll` method removes all keys from the cache.
     */
    removeAll(): Promise<void>;

    /**
     * The `removeByKeyPrefix` method removes all the keys in the cache that starts with the given `prefix`.
     */
    removeByKeyPrefix(prefix: string): Promise<void>;
};

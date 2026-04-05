/**
 * @module Cache
 */
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
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
    get(context: IReadableContext, key: string): Promise<TType | null>;

    /**
     * The `getAndRemove` method returns the value when `key` is found otherwise null will be returned.
     * The key will be removed after it is returned.
     */
    getAndRemove(context: IReadableContext, key: string): Promise<TType | null>;

    /**
     * The `add` method adds a `value` when `key` doesn't exists. Returns `true` when key doesn't exists otherwise `false` will be returned.
     * You can provide a `ttl` value. If null is passed, the item will not expire.
     */
    add(
        context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean>;

    /**
     * The `put` methods upsert the given key and replaces the ttl when updated.
     * Returns `true` when the key was updated otherwise `false` is returned.
     */
    put(
        context: IReadableContext,
        key: string,
        value: TType,
        ttl: TimeSpan | null,
    ): Promise<boolean>;

    /**
     * The `update` method updates the given `key` with given `value`. Returns `true` if the `key` where updated otherwise `false` will be returned.
     */
    update(
        context: IReadableContext,
        key: string,
        value: TType,
    ): Promise<boolean>;

    /**
     * The `increment` method increments the given `key` with given `value`. Returns `true` if the `key` where incremented otherwise `false` will be returned.
     * If `values` is not defined then it will increment the key with 1.
     * An error will thrown if the key is not a number.
     * @throws {TypeError} {@link TypeError}
     */
    increment(
        context: IReadableContext,
        key: string,
        value: number,
    ): Promise<boolean>;

    /**
     * The `removeMany` method removes many keys. Returns `true` if one of the keys where deleted otherwise `false` is returned.
     */
    removeMany(
        context: IReadableContext,
        keys: Array<string>,
    ): Promise<boolean>;

    /**
     * The `removeAll` method removes all keys from the cache.
     */
    removeAll(context: IReadableContext): Promise<void>;

    /**
     * The `removeByKeyPrefix` method removes all the keys in the cache that starts with the given `prefix`.
     */
    removeByKeyPrefix(context: IReadableContext, prefix: string): Promise<void>;
};

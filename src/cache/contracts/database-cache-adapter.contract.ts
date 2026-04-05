/**
 * @module Cache
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheData<TType = unknown> = {
    value: TType;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type IDatabaseCacheTransaction<TType = unknown> = {
    find(
        context: IReadableContext,
        key: string,
    ): Promise<ICacheData<TType> | null>;
    upsert(
        context: IReadableContext,
        key: string,
        value: TType,
        expiration?: Date | null,
    ): Promise<void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheDataExpiration = {
    expiration: Date | null;
};

/**
 * The `IDatabaseCacheAdapter` contract defines a way for as key-value pairs independent of data storage.
 * This contract simplifies the implementation of cache adapters with CRUD-based databases, such as SQL databases and ORMs like TypeOrm and MikroOrm.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type IDatabaseCacheAdapter<TType = unknown> = {
    find(
        context: IReadableContext,
        key: string,
    ): Promise<ICacheData<TType> | null>;

    transaction<TValue>(
        context: IReadableContext,
        trxFn: InvokableFn<
            [trx: IDatabaseCacheTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue>;

    update(
        context: IReadableContext,
        key: string,
        value: TType,
    ): Promise<ICacheDataExpiration | null>;

    removeMany(
        context: IReadableContext,
        keys: Array<string>,
    ): Promise<Array<ICacheDataExpiration>>;

    /**
     * The `removeAll` method removes all keys from the cache.
     */
    removeAll(context: IReadableContext): Promise<void>;

    /**
     * The `removeByKeyPrefix` method removes all the keys in the cache that starts with the given `prefix`.
     */
    removeByKeyPrefix(context: IReadableContext, prefix: string): Promise<void>;
};

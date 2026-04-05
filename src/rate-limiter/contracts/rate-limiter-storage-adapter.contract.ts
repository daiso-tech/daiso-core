/**
 * @module RateLimiter
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterData<TType = unknown> = {
    state: TType;

    /**
     * The expiration date and time of the lock.
     * `null` indicates the lock does not expire.
     */
    expiration: Date;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterStorageAdapterTransaction<TType = unknown> = {
    /**
     * The `upsert` inserts a rate limiter if it doesnt exist otherwise it will be updated.
     *
     * @param key The unique identifier for the rate limiter.
     */
    upsert(
        context: IReadableContext,
        key: string,
        state: TType,
        expiration: Date,
    ): Promise<void>;

    /**
     * Retrieves the current rate limiter state for a given key.
     *
     * @param key The unique identifier for the rate limiter.
     * @returns Returns the rate limiter state if found, otherwise `null`.
     */
    find(
        context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterData<TType> | null>;
};

/**
 * The `IRateLimiterStorageAdapter` contract defines a way for storing rate limiter state independent of the underlying technology.
 * This contract simplifies the implementation of rate limiter adapters with CRUD-based databases, such as SQL databases and ORMs like TypeOrm and MikroOrm.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterStorageAdapter<TType = unknown> = {
    /**
     * The `transaction` method runs the `fn` function inside a transaction.
     * The `fn` function is given a {@link IRateLimiterStorageAdapterTransaction | `IRateLimiterStorageAdapterTransaction`} object.
     */
    transaction<TValue>(
        context: IReadableContext,
        fn: InvokableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue>;

    /**
     * Retrieves the current rate limiter state for a given key.
     *
     * @param key The unique identifier for the rate limiter.
     * @returns Returns the rate limiter state if found, otherwise `null`.
     */
    find(
        context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterData<TType> | null>;

    /**
     * Removes a rate limiter from the database.
     *
     * @param key The unique identifier for the rate limiter to remove.
     */
    remove(context: IReadableContext, key: string): Promise<void>;
};

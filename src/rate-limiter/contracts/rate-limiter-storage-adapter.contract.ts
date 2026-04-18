/**
 * @module RateLimiter
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * Persisted rate limiter state data.
 * Contains the metrics/state object and expiration information for stored rate limiters.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 * @template TType - The type of metrics/state object stored (defined by the policy)
 */
export type IRateLimiterData<TType = unknown> = {
    /**
     * The serialized metrics/state object from the rate limiter policy.
     * This is the persistent representation of attempt tracking and window information.
     * The exact structure depends on the policy algorithm (e.g., fixed-window, sliding-window).
     */
    state: TType;

    /**
     * The expiration date and time for this rate limiter state.
     * Data with past expiration dates should be considered stale and can be cleaned up.
     * Determined by the policy's getExpiration() method.
     *
     * @note Unlike locks, this expiration is always required and should not be null
     */
    expiration: Date;
};

/**
 * Transaction interface for rate limiter storage operations.
 * Provides atomic operations within a database transaction context.
 * All methods execute within the same transaction for ACID compliance.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 * @template TType - The type of metrics/state object being stored
 */
export type IRateLimiterStorageAdapterTransaction<TType = unknown> = {
    /**
     * Inserts a new rate limiter or updates an existing one (upsert operation).
     * Used when recording a new attempt or updating metrics after evaluation.
     * Implementations should use database UPSERT semantics if available.
     *
     * @param context Readable execution context for the operation
     * @param key Unique identifier for the rate limiter
     * @param state The new metrics/state object from the policy
     * @param expiration The calculated expiration date for this state
     */
    upsert(
        context: IReadableContext,
        key: string,
        state: TType,
        expiration: Date,
    ): Promise<void>;

    /**
     * Retrieves the stored rate limiter data for a given key.
     * Used to load existing state when evaluating subsequent attempts.
     * Returns null if the rate limiter hasn't been initialized yet.
     *
     * @param context Readable execution context for the operation
     * @param key Unique identifier for the rate limiter
     * @returns The stored rate limiter data if found, otherwise null
     */
    find(
        context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterData<TType> | null>;
};

/**
 * Storage adapter contract for persisting rate limiter state in databases.
 * Abstracts database operations for rate limiters with CRUD-based storage.
 * Simplifies implementation for SQL databases and ORMs (TypeORM, MikroORM, etc.).
 *
 * Adapters implementing this contract serialize the policy's TMetrics type for storage
 * and deserialize it when loading, handling the conversion to/from TType.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 * @template TType - The type of persisted metrics/state object in the database
 */
export type IRateLimiterStorageAdapter<TType = unknown> = {
    /**
     * Executes rate limiter operations within a database transaction.
     * Provides an {@link IRateLimiterStorageAdapterTransaction | `IRateLimiterStorageAdapterTransaction`}
     * object for atomic find/upsert operations.
     *
     * All database operations within the transaction function should succeed or fail atomically.
     * If the transaction function throws, the transaction should be rolled back.
     *
     * @param context Readable execution context for the operation
     * @param fn Callback function receiving transaction object, should return a Promise
     * @returns The value returned by the fn callback
     */
    transaction<TValue>(
        context: IReadableContext,
        fn: InvokableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue>;

    /**
     * Retrieves the stored rate limiter data without a transaction.
     * Useful for read-only operations or standalone state checks.
     * Returns null if the rate limiter hasn't been initialized.
     *
     * @param context Readable execution context for the operation
     * @param key Unique identifier for the rate limiter
     * @returns The stored rate limiter data if found, otherwise null
     */
    find(
        context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterData<TType> | null>;

    /**
     * Removes a rate limiter entry from the database.
     * Called when explicitly resetting a rate limiter or cleaning up expired entries.
     * Safe to call even if the rate limiter doesn't exist.
     *
     * @param context Readable execution context for the operation
     * @param key Unique identifier for the rate limiter to remove
     */
    remove(context: IReadableContext, key: string): Promise<void>;
};

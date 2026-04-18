/**
 * @module CircuitBreaker
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * Transactional operations interface for circuit breaker state storage.
 * Used within database transactions to ensure atomic updates and consistency.
 *
 * @template TType - The type/shape of the serialized circuit breaker state
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerStorageAdapterTransaction<TType = unknown> = {
    /**
     * Creates a new circuit breaker record if it doesn't exist, or updates the existing one.
     * Used to persist the current state and metrics of a circuit breaker.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the circuit breaker instance
     * @param state - The serialized circuit breaker state to persist
     * @returns Promise that resolves when the upsert operation completes
     */
    upsert(context: IReadableContext, key: string, state: TType): Promise<void>;

    /**
     * Retrieves the persisted circuit breaker state for a given key.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the circuit breaker instance
     * @returns Promise resolving to the circuit breaker state if found, otherwise null
     */
    find(context: IReadableContext, key: string): Promise<TType | null>;
};

/**
 * Technology-agnostic storage adapter contract for persisting circuit breaker state.
 * Implementations handle state persistence using any CRUD-capable storage backend (SQL databases, ORMs like TypeORM/MikroORM, document stores, etc.).
 * Provides transactional support to ensure atomic updates and consistency across distributed systems.
 *
 * @template TType - The type/shape of the serialized circuit breaker state
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerStorageAdapter<TType = unknown> = {
    /**
     * Executes the provided function within a database transaction.
     * Ensures that all operations on the provided transaction object are atomic.
     * Used to coordinate state updates with policy evaluations in a consistent manner.
     *
     * @template TValue - The return type of the transaction function
     * @param context - Readable execution context for the operation
     * @param fn - Function to execute within the transaction, receives transaction object
     * @returns Promise resolving to the return value of the transaction function
     */
    transaction<TValue>(
        context: IReadableContext,
        fn: InvokableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue>;

    /**
     * Retrieves the persisted circuit breaker state for a given key.
     * Used to fetch the current state without opening a transaction.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the circuit breaker instance
     * @returns Promise resolving to the circuit breaker state if found, otherwise null
     */
    find(context: IReadableContext, key: string): Promise<TType | null>;

    /**
     * Removes a circuit breaker record from persistent storage.
     * Used for cleanup when circuit breaker instances are no longer needed.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the circuit breaker instance to remove
     * @returns Promise that resolves when the removal is complete
     */
    remove(context: IReadableContext, key: string): Promise<void>;
};

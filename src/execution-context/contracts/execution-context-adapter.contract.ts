/**
 * @module ExecutionContext
 */

import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Adapter contract for managing execution context storage and lifecycle.
 *
 * This contract defines the contract for storing and retrieving context values
 * in different execution environments (e.g., AsyncLocalStorage for Node.js, thread-local storage).
 * It allows different adapters to implement context tracking differently based on the runtime.
 *
 * The adapter provides context isolation, ensuring each execution path has its own context:
 * - In async environments: context persists across await boundaries within the same execution chain
 * - In threaded environments: context is thread-local, preventing cross-thread interference
 * - In browser environments: context persists within the same call stack
 *
 * Common use cases:
 * - Audit logging: track request ID across nested function calls
 * - User identification: access current user without passing as parameter
 * - Per-request configuration: tenant ID, feature flags, localization
 *
 * @template TValue - The type of the context value being stored
 *
 * @group Contracts
 */
export type IExecutionContextAdapter<TValue> = {
    /**
     * Retrieves the current execution context value.
     * Returns null if no context is set in the current execution scope.
     *
     * Called frequently, should be performant (usually O(1) - direct lookup).
     *
     * @returns The current context value, or null if no context is active
     */
    get(): TValue | null;

    /**
     * Executes the given function within the specified context.
     *
     * This method ensures the provided context is active during function execution,
     * making it accessible to `get()` calls within the function and any nested function calls.
     * When the function completes, the previous context (if any) is restored.
     *
     * Useful for:
     * - Maintaining context across async boundaries
     * - Isolating context between concurrent executions
     * - Implementing per-request or per-task metadata propagation
     *
     * Note: This method is used for both asynchronous and synchronous execution.
     *
     * @template TReturn - The return type of the function
     * @param context - The context value to set for the duration of the function execution
     * @param fn - The function to execute within the context
     * @returns The return value of the executed function
     * @throws Error propagated from the executed function
     */
    run<TReturn>(context: TValue, fn: InvokableFn<[], TReturn>): TReturn;
};

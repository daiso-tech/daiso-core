/**
 * @module ExecutionContext
 */

import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Adapter interface for managing execution context storage and lifecycle.
 *
 * This interface defines the contract for storing and retrieving context values
 * in different execution environments (e.g., AsyncLocalStorage for Node.js, thread-local storage).
 * It allows different adapters to implement context tracking differently based on the runtime.
 *
 * @template TValue - The type of the context value being stored
 */
export type IExecutionContextAdapter<TValue> = {
    /**
     * Retrieves the current execution context value.
     *
     * @returns The current context value, or null if no context is set in the current execution scope
     */
    get(): TValue | null;

    /**
     * Executes the given function within the specified context.
     *
     * This method ensures the provided context is active during function execution,
     * making it accessible to `get()` calls within the function and any nested function calls.
     * Useful for maintaining context across async boundaries or in thread-local scenarios.
     *
     * @template TReturn - The return type of the function
     * @param context - The context value to set for the duration of the function execution
     * @param fn - The function to execute within the context
     * @returns The return value of the executed function
     */
    run<TReturn>(context: TValue, fn: InvokableFn<[], TReturn>): TReturn;
};

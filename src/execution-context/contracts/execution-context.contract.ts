/**
 * @module ExecutionContext
 */

import {
    type Invokable,
    type InvokableFn,
    type Lazyable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Type-safe token for storing and retrieving execution context values.
 *
 * A context token is a unique identifier that acts as a key for storing and accessing
 * values within an execution context. The generic type parameter ensures type safety
 * when storing and retrieving values associated with this token.
 *
 * @template TValue - The type of value this token represents in the context
 */
export type ContextToken<TValue> = {
    /**
     * Unique identifier for this token, used internally as the storage key
     */
    id: string;

    /**
     * Phantom type that is only used for type inference.
     * This property is never actually set at runtime and exists only to help
     * TypeScript infer the correct value type when using get/put operations.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __type: TValue | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Factory function that creates a type-safe context token.
 *
 * This function creates a new token that can be used to store and retrieve values
 * of a specific type within an execution context. The token acts as a typed key
 * that ensures type safety when working with context values.
 *
 * @template TValue - The type of value this token will represent
 * @param id - Unique identifier string for the token (recommend using a descriptive name or UUID)
 * @returns A new ContextToken with the specified ID and type
 *
 * @example
 * import { contextToken } from "@daiso-tech/core/execution-context/contracts";
 *
 * const userToken = contextToken<User>("user");
 * const requestIdToken = contextToken<string>("requestId");
 */
export function contextToken<TValue>(id: string): ContextToken<TValue> {
    return {
        id,
    } as ContextToken<TValue>;
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Configuration for incrementing a numeric context value.
 * Used when updating an existing context value.
 */
export type IncrementSettings = {
    /**
     * The amount to increment by
     * @default 1
     */
    nbr?: number;

    /**
     * Maximum value cap. If set and the result would exceed this, the value is capped at max.
     * @default null (no maximum)
     */
    max?: number | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Configuration for putting (creating or overwriting) and incrementing a numeric context value.
 * Extends IncrementSettings to allow specifying an initial value if the key doesn't exist.
 */
export type PutIncrementSettings = IncrementSettings & {
    /**
     * The initial value to use if the key doesn't exist yet, before incrementing.
     * @default 0
     */
    initialValue?: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Configuration for decrementing a numeric context value.
 * Used when updating an existing context value.
 */
export type DecrementSettings = {
    /**
     * The amount to decrement by
     * @default 1
     */
    nbr?: number;

    /**
     * Minimum value floor. If set and the result would be below this, the value is floored at min.
     * @default null (no minimum)
     */
    min?: number | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Configuration for putting (creating or overwriting) and decrementing a numeric context value.
 * Extends DecrementSettings to allow specifying an initial value if the key doesn't exist.
 */
export type PutDecrementSettings = DecrementSettings & {
    /**
     * The initial value to use if the key doesn't exist yet, before decrementing.
     * @default 0
     */
    initialValue?: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Read-only contract for accessing execution context values.
 *
 * This contract provides methods to retrieve values stored in the execution context.
 * It does not allow modifications, making it suitable for passing as a read-only view
 * of the context to functions that should only inspect values, not modify them.
 */
export type IReadableContext = {
    /**
     * Checks if an array context value contains a specific item or matches a predicate.
     *
     * @template TValue - The item type in the array
     * @param token - Token representing an array in the context
     * @param matchValue - Either the exact value to find, or a predicate function to test items
     * @returns true if the array contains the value or matches the predicate, false otherwise
     */
    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invokable<[value: NoInfer<TValue>], boolean>,
    ): boolean;

    /**
     * Checks if a context value exists (is present in the context).
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to check
     * @returns true if the value exists, false otherwise
     */
    exists<TValue>(token: ContextToken<TValue>): boolean;

    /**
     * Checks if a context value is missing (not present in the context).
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to check
     * @returns true if the value is missing, false if it exists
     */
    missing<TValue>(token: ContextToken<TValue>): boolean;

    /**
     * Retrieves a context value, or null if not found.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to retrieve
     * @returns The context value, or null if not found
     */
    get<TValue>(token: ContextToken<TValue>): TValue | null;

    /**
     * Retrieves a context value with a fallback default value.
     *
     * Returns the stored value if it exists, otherwise returns the provided default.
     * The default value can be a direct value or a lazily-evaluated function.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to retrieve
     * @param defaultValue - The default value to return if not found (can be a function)
     * @returns The context value, or the default value if not found
     */
    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: Lazyable<TValue>,
    ): TValue;

    /**
     * Retrieves a context value, throwing an error if not found.
     *
     * Use this when you expect the value to be present and want to fail fast
     * if it's missing.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to retrieve
     * @returns The context value
     * @throws {NotFoundExecutionContextError} if the value is not found in the context
     */
    getOrFail<TValue>(token: ContextToken<TValue>): TValue;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Read-write contract for managing execution context values.
 *
 * This contract extends IReadableContext and adds methods for storing, updating, and removing
 * values from the execution context. All methods return IContext to enable method chaining.
 * It supports various operations: basic put/update/remove, numeric increment/decrement,
 * array push, and conditional operations.
 */
export type IContext = IReadableContext & {
    /**
     * Adds a value to the context only if it doesn't already exist.
     *
     * If the token already has a value, this operation is a no-op.
     * Useful for initializing context values that should only be set once.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key
     * @param value - The value to add
     * @returns This context instance for method chaining
     */
    add<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext;

    /**
     * Puts a value into the context, creating or overwriting any existing value.
     *
     * This is the primary way to set or update a context value.
     * It always succeeds regardless of whether the key existed before.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key
     * @param value - The value to store
     * @returns This context instance for method chaining
     */
    put<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext;

    /**
     * Puts a numeric value in the context and increments it.
     *
     * If the key doesn't exist, initializes it with the specified initialValue,
     * then increments it. If it exists, increments the current value.
     * Respects the optional max cap.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for initialization and increment behavior
     * @returns This context instance for method chaining
     */
    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IContext;

    /**
     * Puts a numeric value in the context and decrements it.
     *
     * If the key doesn't exist, initializes it with the specified initialValue,
     * then decrements it. If it exists, decrements the current value.
     * Respects the optional min floor.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for initialization and decrement behavior
     * @returns This context instance for method chaining
     */
    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IContext;

    /**
     * Puts an array into the context and pushes values to it.
     *
     * If the key doesn't exist, creates a new array with the provided values.
     * If it exists, appends the provided values to the existing array.
     * Enables accumulating arrays in the context.
     *
     * @template TValue - The item type in the array
     * @param token - Token representing an array in the context
     * @param values - The values to push to the array
     * @returns This context instance for method chaining
     */
    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext;

    /**
     * Updates an existing context value only if it already exists.
     *
     * If the token doesn't have a value, this operation is a no-op.
     * Useful for safely updating values that should already be present.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key
     * @param value - The new value
     * @returns This context instance for method chaining
     */
    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IContext;

    /**
     * Updates an existing numeric value in the context by incrementing it.
     *
     * Only increments if the value already exists.
     * Respects the optional max cap.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for increment behavior
     * @returns This context instance for method chaining
     */
    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IContext;

    /**
     * Updates an existing numeric value in the context by decrementing it.
     *
     * Only decrements if the value already exists.
     * Respects the optional min floor.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for decrement behavior
     * @returns This context instance for method chaining
     */
    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IContext;

    /**
     * Updates an existing array in the context by pushing values to it.
     *
     * Only appends to the array if it already exists.
     * If the value doesn't exist, this operation is a no-op.
     *
     * @template TValue - The item type in the array
     * @param token - Token representing an array in the context
     * @param values - The values to push to the array
     * @returns This context instance for method chaining
     */
    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext;

    /**
     * Removes a value from the context.
     *
     * After removal, the token will be missing from the context.
     * Subsequent get() calls will return null.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key to remove
     * @returns This context instance for method chaining
     */
    remove<TValue>(token: ContextToken<TValue>): IContext;

    /**
     * Conditionally applies one or more operations to the context.
     *
     * If the condition evaluates to true, executes all provided invokable functions
     * with this context. The condition can be a direct boolean or a lazy-evaluated function.
     * Useful for conditional context modifications.
     *
     * @param condition - Boolean condition or function that returns a condition
     * @param invokables - Functions to execute if condition is true, each receives this context
     * @returns This context instance for method chaining
     */
    when(
        condition: Lazyable<boolean>,
        ...invokables: Array<Invokable<[context: IContext], IContext>>
    ): IContext;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Base contract for execution context operations.
 *
 * Provides methods for executing code within an execution context,
 * ensuring context values are accessible during execution.
 */
export type IExecutionContextBase = {
    /**
     * Executes a function within this execution context.
     *
     * The function runs with this context active, making all stored context values
     * accessible to the function and any functions it calls.
     *
     * @template TValue - The return type of the function
     * @param invokable - The function to execute within this context
     * @returns The return value of the executed function
     */
    run<TValue>(invokable: Invokable<[], TValue>): TValue;

    /**
     * Binds a function to this execution context.
     *
     * Returns a new function that, when called, executes the original function
     * within this context. Useful for passing context-bound functions to
     * callbacks, event handlers, or async operations.
     *
     * @template TArgs - The argument types of the function
     * @template TReturn - The return type of the function
     * @param fn - The function to bind to this context
     * @returns A new function that accepts the same arguments and runs within this context
     */
    bind<TArgs extends Array<unknown>, TReturn>(
        fn: Invokable<[...args: TArgs], TReturn>,
    ): InvokableFn<[...args: TArgs], TReturn>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/execution-context/contracts"`
 *
 * Complete execution context contract combining execution capabilities with context management.
 *
 * Combines IExecutionContextBase (for running code with context) and IContext (for reading/writing values).
 * This is the primary contract for working with execution contexts in most scenarios.
 * It allows you to manage context values and execute code within that context.
 */
export type IExecutionContext = IExecutionContextBase & IContext;

/**
 * @internal
 *
 * Internal contract for copyable execution contexts.
 *
 * Extends IContext with the ability to create shallow copies of the context.
 * Used internally by execution context implementations. Not intended for public use.
 */
export type ICopyableContext = IContext & {
    /**
     * Creates a shallow copy of this context.
     *
     * The copy contains the same key-value mappings but is a separate object.
     * Modifications to the copy don't affect the original context.
     *
     * @returns A new context containing the same values as this context
     * @internal
     */
    copy(): ICopyableContext;
};

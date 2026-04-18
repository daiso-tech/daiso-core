/**
 * @module Middleware
 */

import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/no-op-execution-context-adapter.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { applyMiddlewares } from "@/middleware/helpers.js";
import { type Middleware } from "@/middleware/types.js";
import {
    type Invokable,
    type InvokableFn,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * Function that applies a middleware chain to an invokable function or object.
 *
 * Wraps the provided invokable with the specified middlewares, creating a new function
 * that executes all middlewares in priority order before delegating to the original
 * invokable. The execution happens within the provided execution context.
 *
 * @typeParam TParameters - Type of arguments passed to the invokable
 * @typeParam TReturn - Type of value returned from the invokable
 *
 * @param invokable - The function or object to wrap with middleware
 * @param middlewares - One or more middleware to apply, executed in priority order
 *
 * @returns A new invokable function that applies the middleware chain
 *
 * @example
 * ```ts
 * const use = useFactory();
 *
 * // Apply a single middleware
 * const logged = use(fetchData, loggingMiddleware);
 *
 * // Apply multiple middlewares (executed in priority order)
 * const enhanced = use(fetchData, [
 *   { priority: 0, invoke: authMiddleware },
 *   { priority: 10, invoke: cacheMiddleware },
 *   { priority: 20, invoke: loggingMiddleware }
 * ]);
 *
 * // Call the wrapped function
 * const result = logged(arg1, arg2);
 * ```
 *
 * @see {@link UseFactorySettings | `UseFactorySettings`}
 * @see {@link Middleware | `Middleware`}
 * @see {@link Invokable | `Invokable`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type Use = <TParameters extends Array<unknown>, TReturn>(
    invokable: Invokable<TParameters, TReturn>,
    middlewares: OneOrMore<Middleware<TParameters, TReturn>>,
) => InvokableFn<TParameters, TReturn>;

/**
 * Configuration options for creating a middleware application function.
 *
 * Allows customization of the execution context used during middleware execution
 * and the default priority assigned to middlewares without an explicit priority.
 *
 * @example
 * ```ts
 * const customContext = new ExecutionContext(new CustomAdapter());
 * const use = useFactory({
 *   executionContext: customContext,
 *   defaultPriority: 100
 * });
 * ```
 *
 * @see {@link useFactory | `useFactory`}
 * @see {@link IExecutionContext | `IExecutionContext`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type UseFactorySettings = {
    /**
     * The execution context in which middleware will be executed.
     *
     * Used to manage state and context across middleware and invokable execution.
     * Middleware can access this context via the `context` property in {@link MiddlewareArgs | `MiddlewareArgs`}.
     *
     * @default
     * ```ts
     * new ExecutionContext(
     *   new NoOpExecutionContextAdapter()
     * )
     * ```
     *
     * @see {@link IExecutionContext | `IExecutionContext`}
     */
    executionContext?: IExecutionContext;

    /**
     * Default priority for middlewares that do not explicitly set a priority.
     *
     * Middlewares are executed in order of priority (lower values first).
     * This setting applies to function-based middlewares or object middlewares
     * that don't specify a priority.
     *
     * @default 0
     */
    defaultPriority?: number;
};

/**
 * Creates a middleware application function with optional custom settings.
 *
 * Returns a {@link Use | `Use`} function that can wrap invokables with middleware chains.
 * The factory pattern allows reusing the same configuration across multiple invokables,
 * including shared execution context and default middleware priority.
 *
 * @param settings - Configuration for the middleware application function
 *
 * @returns A {@link Use | `Use`} function configured with the provided settings
 *
 * @example
 * ```ts
 * import { useFactory } from '@daiso-tech/core/middleware';
 *
 * // Create with default settings
 * const use = useFactory();
 *
 * // Create with custom execution context
 * const customContext = new ExecutionContext(new MyAdapter());
 * const useWithContext = useFactory({ executionContext: customContext });
 *
 * // Create with custom default priority
 * const useWithPriority = useFactory({ defaultPriority: 50 });
 *
 * // Use the middleware application function
 * const wrappedFunc = use(myFunction, [middleware1, middleware2]);
 * const result = wrappedFunc(...args);
 * ```
 *
 * @see {@link Use | `Use`}
 * @see {@link UseFactorySettings | `UseFactorySettings`}
 * @see {@link Middleware | `Middleware`}
 * @see {@link applyMiddlewares | `applyMiddlewares`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export function useFactory(settings: UseFactorySettings = {}): Use {
    const {
        defaultPriority = 0,
        executionContext = new ExecutionContext(
            new NoOpExecutionContextAdapter(),
        ),
    } = settings;

    return <TParameters extends Array<unknown>, TReturn>(
        invokable: Invokable<TParameters, TReturn>,
        middlewares: OneOrMore<Middleware<TParameters, TReturn>>,
    ): InvokableFn<TParameters, TReturn> => {
        return applyMiddlewares({
            defaultPriority,
            executionContext,
            invokable,
            middlewares,
        });
    };
}

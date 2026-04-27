/**
 * @module Middleware
 */

import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/no-op-execution-context-adapter.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    type IMiddlewareObject,
    type Middleware,
    type NextFn,
    type Use,
} from "@/middleware/contracts/_module.js";
import {
    type InvokableFn,
    type OneOrMore,
    type Invokable,
    resolveOneOrMore,
    isInvokableObject,
    resolveInvokable,
} from "@/utilities/_module.js";

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
 * @group Implementations
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
 * @internal
 */
function isMiddlewareObject<TParameters extends Array<unknown>, TReturn>(
    middleware: Middleware<TParameters, TReturn>,
): middleware is IMiddlewareObject<TParameters, TReturn> {
    return isInvokableObject(middleware);
}

/**
 * @internal
 */
function resolveMiddleware<TParameters extends Array<unknown>, TReturn>(
    middleware: Middleware<TParameters, TReturn>,
    defaultPriority: number,
): Required<IMiddlewareObject<TParameters, TReturn>> {
    if (isMiddlewareObject(middleware)) {
        const { priority = defaultPriority } = middleware;
        return {
            priority,
            invoke: middleware.invoke.bind(middleware),
        };
    } else {
        return {
            priority: defaultPriority,
            invoke: middleware,
        };
    }
}

/**
 * @internal
 */
function resolveMiddlewares<TParameters extends Array<unknown>, TReturn>(
    middlewares: OneOrMore<Middleware<TParameters, TReturn>>,
    defaultPriority: number,
): Array<IMiddlewareObject<TParameters, TReturn>> {
    return [
        ...resolveOneOrMore(middlewares).map((middleware) =>
            resolveMiddleware(middleware, defaultPriority),
        ),
    ].sort((a, b) => a.priority - b.priority);
}

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
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Implementations
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
        const resolvedMiddlewares = resolveMiddlewares(
            middlewares,
            defaultPriority,
        );
        let func = resolveInvokable(invokable);
        for (const middleware of [...resolvedMiddlewares].reverse()) {
            const prevFunc = func;
            func = (...args_: TParameters): TReturn => {
                const next: NextFn<TParameters, TReturn> = (args = args_) => {
                    return prevFunc(...args);
                };
                return middleware.invoke({
                    args: args_,
                    next,
                    context: executionContext,
                });
            };
        }
        const prevFunc = func;
        func = (...args_: TParameters): TReturn => {
            return executionContext.run(() => {
                return prevFunc(...args_);
            });
        };
        return func;
    };
}

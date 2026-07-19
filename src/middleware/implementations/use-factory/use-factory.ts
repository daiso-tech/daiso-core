/**
 * @module Middleware
 */

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
    getInvokableName,
} from "@/utilities/_module.js";

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
 * @internal
 */
const DEFAULT_PRIORITY = 0;

/**
 * @internal
 */
export function useFactory(): Use {
    return <TParameters extends Array<unknown>, TReturn>(
        invokable: Invokable<TParameters, TReturn>,
        middlewares: OneOrMore<Middleware<TParameters, TReturn>>,
    ): InvokableFn<TParameters, TReturn> => {
        const resolvedMiddlewares = resolveMiddlewares(
            middlewares,
            DEFAULT_PRIORITY,
        );
        let func = resolveInvokable(invokable);
        for (const middleware of [...resolvedMiddlewares].reverse()) {
            const prevFunc = func;
            func = (...args_: TParameters): TReturn => {
                const next: NextFn<TParameters, TReturn> = (args = args_) => {
                    return prevFunc(...args);
                };

                // If function has been binded the name field will be "bound fnName"
                // So we need to remove the "bound " prefix.
                let name = getInvokableName(invokable);
                if (name.toLowerCase().startsWith("bound ")) {
                    name = name.slice(6);
                }

                return middleware.invoke({
                    args: args_,
                    next,
                    name,
                });
            };
        }
        const prevFunc = func;
        func = (...args_: TParameters): TReturn => {
            return prevFunc(...args_);
        };
        return func;
    };
}

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 * @group Implementations
 */
export const use = useFactory();

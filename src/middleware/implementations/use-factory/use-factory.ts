/**
 * @module Middleware
 */

import {
    resolveOneOrMore,
    isInvocableObject,
    resolveInvocable,
    getInvocableName,
} from "@/utilities/_module.js";

import type {
    IMiddlewareObject,
    Middleware,
    NextFn,
    Use,
} from "@/middleware/contracts/_module.js";
import type { InvocableFn, OneOrMore, Invocable } from "@/utilities/_module.js";

/**
 * @internal
 */
function isMiddlewareObject<TParameters extends Array<unknown>, TReturn>(
    middleware: Middleware<TParameters, TReturn>,
): middleware is IMiddlewareObject<TParameters, TReturn> {
    return isInvocableObject(middleware);
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
    return resolveOneOrMore(middlewares)
        .map((middleware) => resolveMiddleware(middleware, defaultPriority))
        .sort((a, b) => a.priority - b.priority);
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
        invocable: Invocable<TParameters, TReturn>,
        middlewares: OneOrMore<Middleware<TParameters, TReturn>>,
    ): InvocableFn<TParameters, TReturn> => {
        let func = resolveInvocable(invocable);
        for (const middleware of resolveMiddlewares(
            middlewares,
            DEFAULT_PRIORITY,
        ).reverse()) {
            const prevFunc = func;
            func = (...args_: TParameters): TReturn => {
                const next: NextFn<TParameters, TReturn> = (args = args_) => {
                    return prevFunc(...args);
                };

                // If function has been binded the name field will be "bound fnName"
                // So we need to remove the "bound " prefix.
                let name = getInvocableName(invocable);
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
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export const use = useFactory();

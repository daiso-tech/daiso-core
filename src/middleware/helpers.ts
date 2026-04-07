/**
 * @module Middleware
 */

import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import {
    type IMiddlewareObject,
    type Middleware,
    type NextFn,
} from "@/middleware/types.js";
import {
    type Invokable,
    type InvokableFn,
    resolveOneOrMore,
    resolveInvokable,
    isInvokableObject,
    type OneOrMore,
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
export type ApplyMiddlewaresSettings<
    TParameters extends Array<unknown>,
    TReturn,
> = {
    executionContext: IExecutionContext;
    defaultPriority: number;
    invokable: Invokable<TParameters, TReturn>;
    middlewares: OneOrMore<Middleware<TParameters, TReturn>>;
};

/**
 * @internal
 */
export function applyMiddlewares<TParameters extends Array<unknown>, TReturn>(
    settings: ApplyMiddlewaresSettings<TParameters, TReturn>,
): InvokableFn<TParameters, TReturn> {
    const { middlewares, defaultPriority, invokable, executionContext } =
        settings;
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
}

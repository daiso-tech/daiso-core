/**
 * @module Middleware
 */

import { type IExecutionContext } from "@/execution-context/contracts/_module.js";
import { applyMiddlewares } from "@/middleware/helpers.js";
import { type Middleware } from "@/middleware/types.js";
import {
    type Invokable,
    type InvokableFn,
    type OneOrMore,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type Use = <TParameters extends Array<unknown>, TReturn>(
    invokable: Invokable<TParameters, TReturn>,
    middlewares: OneOrMore<Middleware<TParameters, TReturn>>,
) => InvokableFn<TParameters, TReturn>;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export function useFactory(
    executionContext: IExecutionContext,
    defaultPriority = 0,
): Use {
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

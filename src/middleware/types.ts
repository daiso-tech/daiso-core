/**
 * @module Middleware
 */

import { type IContext } from "@/execution-context/contracts/_module.js";
import {
    type InvokableFn,
    type IInvokableObject,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type NextFn<TParameters extends Array<unknown>, TReturn> = InvokableFn<
    [args?: TParameters],
    TReturn
>;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type MiddlewareArgs<TParameters extends Array<unknown>, TReturn> = {
    args: TParameters;
    next: NextFn<TParameters, TReturn>;
    context: IContext;
};

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type IMiddlewareObject<
    TParameters extends Array<unknown>,
    TReturn,
> = IInvokableObject<[args: MiddlewareArgs<TParameters, TReturn>], TReturn> & {
    priority?: number;
};

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type MiddlewareFn<
    TParameters extends Array<unknown>,
    TReturn,
> = InvokableFn<[args: MiddlewareArgs<TParameters, TReturn>], TReturn>;

/**
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type Middleware<TParameters extends Array<unknown>, TReturn> =
    | MiddlewareFn<TParameters, TReturn>
    | IMiddlewareObject<TParameters, TReturn>;

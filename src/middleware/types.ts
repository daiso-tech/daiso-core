/**
 * @module Middleware
 */

import { type IContext } from "@/execution-context/contracts/_module.js";
import {
    type InvokableFn,
    type IInvokableObject,
} from "@/utilities/_module.js";

/**
 * Represents the next middleware function in the chain.
 *
 * When invoked, continues execution to the next middleware or the final function.
 * Allows middleware to decide whether to proceed with execution and with what arguments.
 *
 * @typeParam TParameters - Type of arguments passed through the middleware chain
 * @typeParam TReturn - Type of value returned from the function
 *
 * @example
 * ```ts
 * // In middleware
 * next() // Continue with original args
 * next([newArg1, newArg2]) // Continue with modified args
 * ```
 *
 * @see {@link MiddlewareArgs | `MiddlewareArgs`}
 * @see {@link MiddlewareFn | `MiddlewareFn`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type NextFn<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = InvokableFn<[args?: TParameters], TReturn>;

/**
 * Arguments passed to middleware functions during execution.
 *
 * Contains the original function arguments, a reference to the next middleware in the chain,
 * and the execution context for accessing and modifying state.
 *
 * @typeParam TParameters - Type of arguments passed to the function
 * @typeParam TReturn - Type of value returned from the function
 *
 * @example
 * ```ts
 * const loggingMiddleware: MiddlewareFn = ({ args, next, context }) => {
 *   console.log('Before:', args);
 *   const result = next(args);
 *   console.log('After:', result);
 *   return result;
 * };
 * ```
 *
 * @see {@link NextFn | `NextFn`}
 * @see {@link MiddlewareFn | `MiddlewareFn`}
 * @see {@link IContext | `IContext`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type MiddlewareArgs<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /** The arguments passed to the original function */
    args: TParameters;
    /** Function to call the next middleware or final function */
    next: NextFn<TParameters, TReturn>;
    /** Execution context for state management */
    context: IContext;
};

/**
 * Middleware implementation as an object with invocation method.
 *
 * Allows middleware to be defined as a class or object with an `invoke` method.
 * The priority property determines the order of execution (lower priority executes first).
 *
 * @typeParam TParameters - Type of arguments passed to the function
 * @typeParam TReturn - Type of value returned from the function
 *
 * @example
 * ```ts
 * class LoggingMiddleware implements IMiddlewareObject {
 *   priority = 10;
 *
 *   invoke({ args, next }: MiddlewareArgs) {
 *     console.log('Executing with:', args);
 *     return next(args);
 *   }
 * }
 * ```
 *
 * @see {@link MiddlewareFn | `MiddlewareFn`}
 * @see {@link Middleware | `Middleware`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type IMiddlewareObject<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = IInvokableObject<[args: MiddlewareArgs<TParameters, TReturn>], TReturn> & {
    /** Execution priority. Lower values execute first. Defaults to 0. */
    priority?: number;
};

/**
 * Middleware implementation as a function.
 *
 * A function-based middleware that receives {@link MiddlewareArgs | `MiddlewareArgs`} and returns the result
 * of processing. This is the most common and flexible way to define middleware.
 *
 * @typeParam TParameters - Type of arguments passed to the function
 * @typeParam TReturn - Type of value returned from the function
 *
 * @example
 * ```ts
 * const cacheToken = contextToken<Map<string, unknown>>("cache");
 *
 * const cacheMiddleware: MiddlewareFn = async ({ args, next, context }) => {
 *   const cacheKey = JSON.stringify(args);
 *   const cache = context.getOr(cacheToken, () => new Map());
 *   if (cache.has(cacheKey)) return cache.get(cacheKey);
 *
 *   const result = await next(args);
 *   cache.set(cacheKey, result);
 *   context.put(cacheToken, cache);
 *   return result;
 * };
 * ```
 *
 * @see {@link IMiddlewareObject | `IMiddlewareObject`}
 * @see {@link Middleware | `Middleware`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type MiddlewareFn<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = InvokableFn<[args: MiddlewareArgs<TParameters, TReturn>], TReturn>;

/**
 * A middleware in the execution chain.
 *
 * Can be either a function or an object implementation. Both forms have access to
 * the original arguments, the next middleware function, and the execution context.
 *
 * Middlewares are executed in order of priority (lower priority first), and each
 * middleware can:
 * - Log or monitor function calls
 * - Modify arguments before passing to next middleware
 * - Cache results
 * - Handle errors
 * - Modify return values
 * - Access and manipulate execution context
 *
 * @typeParam TParameters - Type of arguments passed to the function
 * @typeParam TReturn - Type of value returned from the function
 *
 * @see {@link MiddlewareFn | `MiddlewareFn`}
 * @see {@link IMiddlewareObject | `IMiddlewareObject`}
 * @see {@link MiddlewareArgs | `MiddlewareArgs`}
 *
 * IMPORT_PATH: `@daiso-tech/core/middleware`
 */
export type Middleware<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> =
    | MiddlewareFn<TParameters, TReturn>
    | IMiddlewareObject<TParameters, TReturn>;

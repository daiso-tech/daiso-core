/**
 * @module Middleware
 */

import { type IContext } from "@/execution-context/contracts/_module.js";
import {
    type InvokableFn,
    type IInvokableObject,
    type OneOrMore,
    type Invokable,
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
 * @group Contracts
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
 * @group Contracts
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
 * @group Contracts
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
 * @group Contracts
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
 * @group Contracts
 */
export type Middleware<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> =
    | MiddlewareFn<TParameters, TReturn>
    | IMiddlewareObject<TParameters, TReturn>;

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
 * @group Contracts
 */
export type Use = <TParameters extends Array<unknown>, TReturn>(
    invokable: Invokable<TParameters, TReturn>,
    middlewares: OneOrMore<Middleware<TParameters, TReturn>>,
) => InvokableFn<TParameters, TReturn>;

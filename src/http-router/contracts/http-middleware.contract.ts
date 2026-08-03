/**
 * @module HttpRouter
 */

import { type HttpHandlerArgs } from "@/http-router/contracts/http-handler.contract.js";
import { type IHttpRes } from "@/http-router/contracts/http-res.contract.js";
import {
    type IInvocableObject,
    type InvocableFn,
    type Promisable,
} from "@/utilities/_module.js";

/**
 * The next function in the middleware chain.
 * Calling it passes control to the next middleware or the final handler.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpNextFn = InvocableFn<[], Promisable<IHttpRes>>;

/**
 * The arguments passed to a middleware function or object.
 * Extends {@link HttpHandlerArgs} with a `next` function.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpMiddlewareArgs = HttpHandlerArgs & {
    /**
     * The next function in the middleware chain.
     */
    next: HttpNextFn;
};

/**
 * An invocable object that acts as HTTP middleware.
 * Receives {@link HttpMiddlewareArgs} (request, response builder, context, next)
 * and returns a response.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpMiddlewareObject = IInvocableObject<
    [args: HttpMiddlewareArgs],
    Promisable<IHttpRes>
>;

/**
 * A function that acts as HTTP middleware.
 * Receives {@link HttpMiddlewareArgs} (request, response builder, context, next)
 * and returns a response.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpMiddlewareFn = InvocableFn<
    [args: HttpMiddlewareArgs],
    Promisable<IHttpRes>
>;

/**
 * A union of all middleware forms: a function or an invocable object.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpMiddleware = HttpMiddlewareFn | IHttpMiddlewareObject;

/**
 * A helper function that creates a typed {@link HttpMiddleware} definition.
 * Use this function to get full type inference for request data, files,
 * and cookie data when defining inline middleware registrations.
 *
 * @param middleware - The middleware registration configuration object.
 * @returns The same middleware registration configuration object with inferred types.
 *
 * @example
 * ```typescript
 * defineHttpMiddleware(async ({ req, next }) => { ... });
 * ```
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export function defineHttpMiddleware(
    middleware: HttpMiddleware,
): HttpMiddleware {
    return middleware;
}

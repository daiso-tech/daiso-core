/**
 * @module HttpRouter
 */

import { type InvokableFn } from "@/utilities/_module.js";

/**
 * A function that handles an HTTP request using the WinterTC fetch signature.
 *
 * Receives a standard Web API `Request` and returns a `Response`, either
 * synchronously or as a promise. This is the universal handler signature
 * used by WinterTC-compatible runtimes (Node.js, Bun, Deno, Cloudflare
 * Workers, etc.).
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type WinterTcRequestHandler = InvokableFn<
    [request: Request],
    Promise<Response>
>;

/**
 * A function-based WinterTC middleware.
 *
 * Receives the incoming `Request` and a `next` handler to delegate to
 * the downstream handler or middleware in the chain. Returns a `Response`,
 * either synchronously or as a promise.
 *
 * This is the lightweight, functional alternative to
 * {@link IWinterTcMiddlewareObject}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type WinterTcMiddlewareFn = InvokableFn<
    [request: Request, next: WinterTcRequestHandler],
    Promise<Response>
>;

/**
 * An object-based WinterTC middleware.
 *
 * Implements the WinterTC middleware contract as an invokable object rather
 * than a plain function. Receives the incoming `Request` and a `next` handler,
 * and returns a `Response`, either synchronously or as a promise.
 *
 * This is the object-oriented alternative to {@link WinterTcMiddlewareFn}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IWinterTcMiddlewareObject = InvokableFn<
    [request: Request, next: WinterTcRequestHandler],
    Promise<Response>
>;

/**
 * A discriminated union of WinterTC middleware implementations.
 *
 * Accepts either a function-based ({@link WinterTcMiddlewareFn}) or
 * an object-based ({@link IWinterTcMiddlewareObject}) middleware,
 * allowing consumers to pass either form interchangeably.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type WinterTcMiddleware =
    | WinterTcMiddlewareFn
    | IWinterTcMiddlewareObject;

/**
 * Defines a WinterTC middleware function with type inference.
 *
 * A convenience helper that ensures the provided handler conforms to the
 * {@link WinterTcMiddlewareFn} signature while preserving exact parameter
 * and return types. This allows TypeScript to infer narrower types in the
 * handler body without needing explicit annotations.
 *
 * Use this when defining middleware functions to get accurate type checking
 * and IntelliSense without sacrificing type safety.
 *
 * @param handler - A function conforming to {@link WinterTcMiddlewareFn}.
 * @returns The same handler, typed as {@link WinterTcMiddlewareFn}.
 *
 * @example
 * ```ts
 * const loggerMiddleware = defineWinterTcMiddleware(async (request, next) => {
 *     console.log(`${request.method} ${request.url}`);
 *     const response = await next(request);
 *     console.log(`${response.status}`);
 *     return response;
 * });
 * ```
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export function defineWinterTcMiddleware(
    handler: WinterTcMiddlewareFn,
): WinterTcMiddlewareFn {
    return handler;
}

/**
 * Defines the contract for a WinterTC-compatible `fetch` function.
 *
 * WinterTC is a cross-runtime fetch standard that allows HTTP routers and handlers
 * to be portable across different JavaScript runtimes (Node.js, Bun, Deno, Cloudflare Workers, etc.)
 * by adhering to the standard `fetch` API signature.
 *
 * Implementing this interface ensures that a router can be used as a WinterTC-compatible
 * request handler, enabling seamless integration with WinterTC-based adapters and middleware.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IWinterTcFetch = {
    /**
     * Handles an incoming HTTP request and returns a response.
     *
     * @param request - The standard `Request` object representing the incoming HTTP request.
     * @returns The response to send back, either synchronously or as a promise.
     */
    fetch: WinterTcRequestHandler;
};

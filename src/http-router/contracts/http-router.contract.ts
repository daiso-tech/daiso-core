/**
 * @module HttpRouter
 */

import { type HttpHandler } from "@/http-router/contracts/http-handler.contract.js";
import { type HttpMiddleware } from "@/http-router/contracts/http-middleware.contract.js";
import { type HttpMethod } from "@/http-router/contracts/http-req.contract.js";
import { type IWinterTcFetch } from "@/http-router/contracts/winter-tc-fetch.contract.js";
import {
    type InvokableFn,
    type IInvokableObject,
    type OneOrAtLeastOne,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * A builder for registering type-safe middleware scoped to a single endpoint.
 *
 * Used within {@link IHttpEndpoint.middlewares} to add middleware that applies
 * only to that specific endpoint. This keeps middleware isolated and prevents
 * it from affecting other routes.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IMiddlewareBuilder = {
    /**
     * Registers one or more middleware handlers with fully typed request data inference.
     *
     * @param middleware - One or more middleware registrations.
     * @returns The builder instance for chaining.
     */
    use(middleware: HttpMiddleware): IMiddlewareBuilder;
};

/**
 * Defines a single HTTP endpoint registration.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpEndpoint = {
    /**
     * The URL path pattern for this endpoint.
     */
    url: string;

    /**
     * The HTTP method(s) this endpoint responds to.
     *
     * @default
     * ```ts
     * [
     *  "CONNECT",
     *  "DELETE",
     *  "GET",
     *  "HEAD",
     *  "OPTIONS",
     *  "PATCH",
     *  "POST",
     *  "PUT",
     *  "TRACE",
     * ]
     * ```
     */
    method?: OneOrAtLeastOne<HttpMethod>;

    /**
     * The handler that processes requests to this endpoint.
     */
    handler: HttpHandler;

    /**
     * Middleware handlers that apply **only to this endpoint**.
     * Prefer this over {@link IHttpRouterBase.use} when the middleware is
     * specific to a single route — it keeps middleware scoped and avoids
     * unintended side effects on other endpoints.
     */
    middlewares?: Invokable<[builder: IMiddlewareBuilder], void>;
};

/**
 * A helper function that creates a typed {@link IHttpEndpoint} definition.
 * Use this function to get full type inference for request data, files,
 * and cookie data when defining inline endpoint objects.
 *
 * @param endpoint - The endpoint configuration object.
 * @returns The same endpoint configuration object with inferred types.
 *
 * @example
 * ```typescript
 * defineHttpEndpoint({
 *   url: "/users/:id",
 *   method: "GET",
 *   handler: async ({ req }) => { ... },
 * });
 * ```
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export function defineHttpEndpoint(endpoint: IHttpEndpoint): IHttpEndpoint {
    return endpoint;
}

/**
 * The base HTTP router interface providing route registration methods
 * ({@link IHttpRouterBase.use}, {@link IHttpRouterBase.endpoint},
 * {@link IHttpRouterBase.group}) without the WinterTC {@link IWinterTcFetch.fetch}
 * boundary.
 *
 * Separated from {@link IHttpRouter} so that sub-routers created via
 * {@link IHttpRouterBase.group} can re-use the registration API without
 * exposing a second `fetch` entry point. The full router is
 * `IHttpRouter = IHttpRouterBase & IWinterTcFetch`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpRouterBase = {
    /**
     * Registers one or more type-safe middleware handlers that apply to
     * **multiple routes**.
     *
     * Use this method for cross-cutting concerns like authentication,
     * logging, or rate-limiting that should run across several endpoints.
     *
     * For middleware that should run on only one endpoint, set the
     * {@link IHttpEndpoint.middlewares} property directly on that
     * endpoint definition instead — this scopes the middleware to that
     * route alone and prevents it from affecting other endpoints.
     *
     * @param middleware - One or more middleware registrations.
     * @returns The router instance for chaining.
     */
    use(middleware: HttpMiddleware): IHttpRouterBase;

    /**
     * Registers a single endpoint with fully typed request data inference.
     *
     * @param endpoint - The endpoint definition.
     * @returns The router instance for chaining.
     */
    endpoint(endpoint: IHttpEndpoint): IHttpRouterBase;

    /**
     * Groups a set of routes under an optional path prefix.
     *
     * @param group - A callback that receives a sub-router to register routes on.
     * @returns The router instance for chaining.
     */
    group(group: HttpRouteGroup): IHttpRouterBase;

    /**
     * Groups a set of routes under a path prefix.
     *
     * @param prefix - The URL prefix for this route group (e.g. "/api/v1").
     * @param group - A callback that receives a sub-router to register routes on.
     * @returns The router instance for chaining.
     */
    group(prefix: string, group: HttpRouteGroup): IHttpRouterBase;
};

/**
 * A function that receives a sub-router and returns it after registering routes.
 * Used as a lightweight alternative to {@link IHttpRouteGroupObject}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpRouteGroupFn = InvokableFn<[router: IHttpRouterBase], void>;

/**
 * An invokable object that receives a sub-router and returns it after registering routes.
 * Used when state or configuration needs to be encapsulated alongside the route logic.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpRouteGroupObject = IInvokableObject<
    [router: IHttpRouterBase],
    void
>;

/**
 * A callable that receives a sub-router and returns it after registering routes.
 * Used with {@link IHttpRouter.group} to group endpoints under a shared prefix.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpRouteGroup = HttpRouteGroupFn | IHttpRouteGroupObject;

/**
 * The full HTTP router interface combining the route registration API
 * from {@link IHttpRouterBase} with the WinterTC {@link IWinterTcFetch.fetch}
 * boundary for handling incoming requests.
 *
 * This is the primary type users interact with — it exposes both
 * {@link IHttpRouterBase.use | use}, {@link IHttpRouterBase.endpoint | endpoint},
 * {@link IHttpRouterBase.group | group} for defining routes, and
 * {@link IWinterTcFetch.fetch | fetch} for dispatching requests.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpRouter = IHttpRouterBase & IWinterTcFetch;

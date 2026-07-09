/**
 * @module HttpRouter
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type FileInputs,
    type ReqInputs,
    type StringInputs,
} from "@/http-router/contracts/_shared.js";
import { type HttpHandler } from "@/http-router/contracts/http-handler.contract.js";
import { type HttpMiddlewareHandler } from "@/http-router/contracts/http-middleware.contract.js";
import {
    type HttpMethod,
    type HttpReqSchema,
} from "@/http-router/contracts/http-req.contract.js";
import { type IWinterTcFetch } from "@/http-router/contracts/winter-tc-fetch.contract.js";
import {
    type InvokableFn,
    type IInvokableObject,
    type OneOrAtLeastOne,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * Combines request-data and cookie validation schemas into a single schema type.
 * Each field maps directly to its own type parameter for reliable inference.
 *
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpSchema<
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
    req?: HttpReqSchema<
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles
    >;
    cookies?: StandardSchemaV1<StringInputs, TCookieData>;
};

/**
 * Pairs a middleware handler with optional validation schemas.
 * Used with {@link IHttpRouterBase.use} to register middlewares that validate
 * and process incoming requests before they reach the endpoint handler.
 *
 * @typeParam TReqMethod - The HTTP method for this middleware.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpMiddleware<
    TReqMethod extends HttpMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
    handler: HttpMiddlewareHandler<
        TReqMethod,
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >;

    /**
     * Optional validation schemas for request data.
     */
    validation?: HttpSchema<
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >;
};

/**
 * A helper function that creates a typed {@link HttpMiddleware} definition.
 * Use this function to get full type inference for request data, files,
 * and cookie data when defining inline middleware registrations.
 *
 * @typeParam TReqMethod - The HTTP method for this middleware.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * @param middleware - The middleware registration configuration object.
 * @returns The same middleware registration configuration object with inferred types.
 *
 * @example
 * ```typescript
 * defineHttpMiddleware({
 *   handler: async ({ req, next }) => { ... },
 *   validation: { headers: myHeaderSchema },
 * });
 * ```
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export function defineHttpMiddleware<
    TReqMethod extends HttpMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
>(
    middleware: HttpMiddleware<
        TReqMethod,
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >,
): HttpMiddleware<
    TReqMethod,
    TReqJson,
    TReqFields,
    TReqParams,
    TReqSearchParams,
    TReqHeaders,
    TReqFiles,
    TCookieData
> {
    return middleware;
}

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
     * @typeParam TReqMethod - The HTTP method scope for this middleware.
     * @typeParam TReqJson - The type of the parsed JSON body.
     * @typeParam TReqFields - The type of the parsed form fields.
     * @typeParam TReqParams - The type of the parsed path parameters.
     * @typeParam TReqSearchParams - The type of the parsed query parameters.
     * @typeParam TReqHeaders - The type of the parsed headers.
     * @typeParam TReqFiles - The expected file definitions.
     * @typeParam TCookieData - A record mapping cookie names to their value types.
     *
     * @param middleware - One or more middleware registrations.
     * @returns The builder instance for chaining.
     */
    use<
        TReqMethod extends HttpMethod = HttpMethod,
        TReqJson = unknown,
        TReqFields extends ReqInputs = ReqInputs,
        TReqParams extends ReqInputs = ReqInputs,
        TReqSearchParams extends ReqInputs = ReqInputs,
        TReqHeaders extends ReqInputs = ReqInputs,
        TReqFiles extends FileInputs = FileInputs,
        TCookieData extends StringInputs = StringInputs,
    >(
        middleware: HttpMiddleware<
            TReqMethod,
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        >,
    ): IMiddlewareBuilder;
};

/**
 * Defines a single HTTP endpoint registration.
 *
 * @typeParam TReqMethod - The HTTP method for this endpoint.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpEndpoint<
    TReqMethod extends HttpMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = {
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
    method?: OneOrAtLeastOne<TReqMethod>;

    /**
     * The handler that processes requests to this endpoint.
     */
    handler: HttpHandler<
        TReqMethod,
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >;

    /**
     * Optional validation schemas for request data.
     */
    validation?: HttpSchema<
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >;

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
 * @typeParam TReqMethod - The HTTP method for this endpoint.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
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
export function defineHttpEndpoint<
    TReqMethod extends HttpMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
>(
    endpoint: IHttpEndpoint<
        TReqMethod,
        TReqJson,
        TReqFields,
        TReqParams,
        TReqSearchParams,
        TReqHeaders,
        TReqFiles,
        TCookieData
    >,
): IHttpEndpoint<
    TReqMethod,
    TReqJson,
    TReqFields,
    TReqParams,
    TReqSearchParams,
    TReqHeaders,
    TReqFiles,
    TCookieData
> {
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
     * @typeParam TReqMethod - The HTTP method scope for this middleware.
     * @typeParam TReqJson - The type of the parsed JSON body.
     * @typeParam TReqFields - The type of the parsed form fields.
     * @typeParam TReqParams - The type of the parsed path parameters.
     * @typeParam TReqSearchParams - The type of the parsed query parameters.
     * @typeParam TReqHeaders - The type of the parsed headers.
     * @typeParam TReqFiles - The expected file definitions.
     * @typeParam TCookieData - A record mapping cookie names to their value types.
     *
     * @param middleware - One or more middleware registrations.
     * @returns The router instance for chaining.
     */
    use<
        TReqMethod extends HttpMethod = HttpMethod,
        TReqJson = unknown,
        TReqFields extends ReqInputs = ReqInputs,
        TReqParams extends ReqInputs = ReqInputs,
        TReqSearchParams extends ReqInputs = ReqInputs,
        TReqHeaders extends ReqInputs = ReqInputs,
        TReqFiles extends FileInputs = FileInputs,
        TCookieData extends StringInputs = StringInputs,
    >(
        middleware: HttpMiddleware<
            TReqMethod,
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        >,
    ): IHttpRouterBase;

    /**
     * Registers a single endpoint with fully typed request data inference.
     *
     * @typeParam TReqMethod - The HTTP method for this endpoint.
     * @typeParam TReqJson - The type of the parsed JSON body.
     * @typeParam TReqFields - The type of the parsed form fields.
     * @typeParam TReqParams - The type of the parsed path parameters.
     * @typeParam TReqSearchParams - The type of the parsed query parameters.
     * @typeParam TReqHeaders - The type of the parsed headers.
     * @typeParam TReqFiles - The expected file definitions.
     * @typeParam TCookieData - A record mapping cookie names to their value types.
     *
     * @param endpoint - The endpoint definition.
     * @returns The router instance for chaining.
     */
    endpoint<
        TReqMethod extends HttpMethod = HttpMethod,
        TReqJson = unknown,
        TReqFields extends ReqInputs = ReqInputs,
        TReqParams extends ReqInputs = ReqInputs,
        TReqSearchParams extends ReqInputs = ReqInputs,
        TReqHeaders extends ReqInputs = ReqInputs,
        TReqFiles extends FileInputs = FileInputs,
        TCookieData extends StringInputs = StringInputs,
    >(
        endpoint: IHttpEndpoint<
            TReqMethod,
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        >,
    ): IHttpRouterBase;

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

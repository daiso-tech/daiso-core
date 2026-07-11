/**
 * @module HttpRouter
 */
import {
    type ParamIndexMap,
    type Params,
    type ParamStash,
    type Router,
} from "hono/router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import {
    type HttpMiddleware,
    type HttpRouteGroup,
    type IHttpEndpoint,
    type IHttpRouter,
    type IHttpRouterBase,
    type StringInputs,
    type IHttpRes,
    type WinterTcMiddleware,
    type WinterTcRequestHandler,
    type HttpHandlerArgs,
    type HttpMiddlewareArgs,
} from "@/http-router/contracts/_module.js";
import { HttpReq } from "@/http-router/implementations/http-req.js";
import {
    HttpRes,
    httpResHelpers,
} from "@/http-router/implementations/http-res.js";
import { HttpRouterBase } from "@/http-router/implementations/http-router-base.js";
import {
    type EndpointEntry,
    type MiddlewareEntry,
    type RouterEntry,
} from "@/http-router/implementations/types.js";
import { use } from "@/http-router/middlewares/_module.js";
import {
    callInvokable,
    type InvokableFn,
    type OneOrMore,
    type Promisable,
} from "@/utilities/_module.js";

/**
 * Configuration options for {@link HttpRouter}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type HttpRouterSettings = {
    /**
     * A Hono router instance.
     * @default
     * ```ts
     * import { RegExpRouter } from "hono/router/reg-exp-router";
     * import { SmartRouter } from "hono/router/smart-router";
     * import { TrieRouter } from "hono/router/trie-router";
     *
     * new SmartRouter({
     *   routers: [new RegExpRouter(), new TrieRouter()],
     * })
     * ```
     */
    router: Router<RouterEntry>;

    /**
     * One or more WinterTC middleware functions or objects to apply to
     * every incoming request before route matching.
     *
     * These run at the top level of the router, before any route-specific
     * middlewares or endpoint handlers. Useful for cross-cutting concerns
     * such as logging, CORS, authentication, or request timing.
     */
    middlewares?: OneOrMore<WinterTcMiddleware>;
};

/**
 * A pre-configured default Hono router adapter combining {@link https://github.com/honojs/router | RegExpRouter}
 * and {@link https://github.com/honojs/router | TrieRouter} via {@link https://github.com/honojs/router | SmartRouter}.
 *
 * `SmartRouter` automatically selects the best matching router for each route,
 * providing optimized routing performance across different URL patterns.
 *
 * @default
 * ```ts
 * new SmartRouter({
 *   routers: [new RegExpRouter(), new TrieRouter()],
 * })
 * ```
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export const defaultHttpRouterAdapter = new SmartRouter<RouterEntry>({
    routers: [new RegExpRouter(), new TrieRouter()],
});

/**
 * The default implementation of {@link IHttpRouter} and {@link IWinterTcFetch}.
 *
 * Implements the **Winter TC fetch object standard**, which means it exposes a
 * standard `fetch(request): Response` signature. This allows it to be easily
 * integrated directly into frameworks that support the fetch API, such as:
 * Next.js, Nuxt, SvelteKit, AnalogJS, TanStack Start, SolidStart, and Hono's
 * runtime adapters (Node.js, Bun, Deno, AWS lambda, Azure Functions, Google Cloud Run etc.).
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 *
 * const router = new HttpRouter();
 *
 * router.endpoint({
 *   url: "/users/:id",
 *   method: "GET",
 *   handler: async ({ req }) => {
 *     const { id } = req.params();
 *     return HttpRes.json({ id });
 *   },
 *   validation: {
 *     params: z.object({ id: z.string() }),
 *   },
 * });
 * ```
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */

/**
 * @internal
 */
type EndpointMatch = [EndpointEntry, Params | ParamIndexMap];

/**
 * @internal
 */
type MiddlewareMatch = [MiddlewareEntry, Params | ParamIndexMap];

/**
 * @internal
 */
type ResolveRouteReturn = {
    endpointMatch: EndpointMatch;
    middlewareMatches: Array<MiddlewareMatch>;
    paramsStash: ParamStash | undefined;
};

export class HttpRouter implements IHttpRouter {
    private readonly router: Router<RouterEntry>;
    private readonly httpRouterBase: HttpRouterBase;
    private readonly middlewares: OneOrMore<WinterTcMiddleware>;

    readonly fetch: WinterTcRequestHandler;

    /**
     * Creates a new `HttpRouter` instance.
     *
     * @param settings - Configuration options for the router.
     */
    constructor(settings: HttpRouterSettings) {
        const { router, middlewares = [] } = settings;

        this.router = router;
        this.middlewares = middlewares;
        this.httpRouterBase = new HttpRouterBase("/", [], this.router);
        this.fetch = use(async (req) => {
            const routeResult = HttpRouter.resolveRoute(this.router, req);
            if (routeResult === null) {
                return httpResHelpers.notFound().buildWebRes();
            }

            const { endpointMatch, middlewareMatches, paramsStash } =
                routeResult;

            const rawParams = HttpRouter.resolveParams(
                endpointMatch[1],
                paramsStash,
            );

            const httpRes = await HttpRouter.buildHandlerChain(
                req,
                rawParams,
                endpointMatch,
                middlewareMatches,
            );

            return httpRes.buildWebRes();
        }, this.middlewares);
    }

    private static resolveRoute(
        router: Router<RouterEntry>,
        request: Request,
    ): ResolveRouteReturn | null {
        const url = new URL(request.url);
        const result = router.match(
            request.method,
            `${url.pathname}${String(url.searchParams)}`,
        );
        const [matches, paramsStash] = result;

        const index = matches.findIndex(
            ([routerEntry]) => routerEntry.type === "endpoint",
        );
        const endpointMatch = matches[index];
        if (endpointMatch === undefined) {
            return null;
        }
        if (endpointMatch[0].type === "middleware") {
            throw new Error(
                "Internal router error: unexpected middleware entry at endpoint position.",
            );
        }

        const middlewareMatches = matches
            .slice(0, index)
            .filter(([routerEntry]) => routerEntry.type === "middleware");

        return {
            endpointMatch: endpointMatch as EndpointMatch,
            middlewareMatches: middlewareMatches as Array<MiddlewareMatch>,
            paramsStash,
        };
    }

    private static isParamIndexMap(
        map: Params | ParamIndexMap,
    ): map is ParamIndexMap {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const [firstValue] = Object.values(map);
        return firstValue !== undefined && typeof firstValue === "number";
    }

    private static resolveParams(
        paramMap: Params | ParamIndexMap,
        paramsStash: ParamStash | undefined,
    ): StringInputs {
        if (paramsStash !== undefined && HttpRouter.isParamIndexMap(paramMap)) {
            return Object.fromEntries(
                Object.entries(paramMap).map(([name, index]) => [
                    name,
                    paramsStash[index],
                ]),
            );
        }
        return paramMap as StringInputs;
    }

    private static async buildHandlerChain(
        request: Request,
        rawParams: StringInputs,
        endpointMatch: EndpointMatch,
        middlewareMatches: Array<MiddlewareMatch>,
    ): Promise<IHttpRes> {
        const endpoint = endpointMatch[0].endpoint;
        const httpReq = HttpReq.fromWebReq({
            request,
            _rawParams: rawParams,
        });
        const httpRes = new HttpRes();
        const context = new Context(new Map());

        const handlerArgs: HttpHandlerArgs = {
            req: httpReq,
            res: httpRes,
            context,
            ...httpResHelpers,
        };
        let chain: InvokableFn<[], Promisable<IHttpRes>> = () => {
            return callInvokable(endpoint.handler, handlerArgs);
        };

        for (const middlewareEntry of [...middlewareMatches].reverse()) {
            const middleware = middlewareEntry[0].middleware;
            const nextHandler = chain;
            chain = () => {
                const middlewareArgs: HttpMiddlewareArgs = {
                    ...handlerArgs,
                    req: httpReq,
                    next: () => nextHandler(),
                };
                return callInvokable(middleware, middlewareArgs);
            };
        }

        return await chain();
    }

    use(middleware: HttpMiddleware): IHttpRouterBase {
        return this.httpRouterBase.use(middleware);
    }

    endpoint(endpoint: IHttpEndpoint): IHttpRouterBase {
        return this.httpRouterBase.endpoint(endpoint);
    }

    group(group: HttpRouteGroup): IHttpRouterBase;
    group(prefix: string, group: HttpRouteGroup): IHttpRouterBase;
    group(
        prefixOrGroup: string | HttpRouteGroup,
        group?: HttpRouteGroup,
    ): IHttpRouterBase {
        if (typeof prefixOrGroup === "object") {
            return this.httpRouterBase.group(prefixOrGroup);
        }

        if (group !== undefined && typeof prefixOrGroup === "string") {
            return this.httpRouterBase.group(prefixOrGroup, group);
        }

        throw new TypeError(
            "Invalid arguments: expected a route group function or a prefix string and group function.",
        );
    }
}

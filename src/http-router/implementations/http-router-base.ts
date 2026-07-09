/**
 * @module HttpRouter
 */
import { type Router } from "hono/router";

import {
    type FileDef,
    type FileInputs,
    type HttpMethod,
    type HttpMiddleware,
    type HttpRouteGroup,
    type IHttpEndpoint,
    type IHttpRouterBase,
    type ReqInputs,
    type StringInputs,
} from "@/http-router/contracts/_module.js";
import { MiddlewareBuilder } from "@/http-router/implementations/middleware-builder.js";
import { type RouterEntry } from "@/http-router/implementations/types.js";
import { callInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class HttpRouterBase implements IHttpRouterBase {
    constructor(
        private readonly prefix: string,
        private readonly middlewares: Array<HttpMiddleware<HttpMethod, any>>,
        private readonly router: Router<RouterEntry>,
    ) {}

    use<
        TReqMethod extends HttpMethod = HttpMethod,
        TReqJson = unknown,
        TReqFields extends ReqInputs = Partial<Record<string, unknown>>,
        TReqParams extends ReqInputs = Partial<Record<string, unknown>>,
        TReqSearchParams extends ReqInputs = Partial<Record<string, unknown>>,
        TReqHeaders extends ReqInputs = Partial<Record<string, unknown>>,
        TReqFiles extends FileInputs = Partial<Record<string, FileDef>>,
        TCookieData extends StringInputs = Partial<Record<string, string>>,
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
    ): IHttpRouterBase {
        this.middlewares.push(middleware as HttpMiddleware<HttpMethod, any>);
        return this;
    }

    private withPrefix(subPath: string): string {
        return [this.prefix, subPath].join("/").replaceAll("//", "/");
    }

    endpoint<
        TReqMethod extends HttpMethod = HttpMethod,
        TReqJson = unknown,
        TReqFields extends ReqInputs = Partial<Record<string, unknown>>,
        TReqParams extends ReqInputs = Partial<Record<string, unknown>>,
        TReqSearchParams extends ReqInputs = Partial<Record<string, unknown>>,
        TReqHeaders extends ReqInputs = Partial<Record<string, unknown>>,
        TReqFiles extends FileInputs = Partial<Record<string, FileDef>>,
        TCookieData extends StringInputs = Partial<Record<string, string>>,
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
    ): IHttpRouterBase {
        const endpoint_ = endpoint as IHttpEndpoint<HttpMethod, any>;
        const {
            method: methods = [
                "CONNECT",
                "DELETE",
                "GET",
                "HEAD",
                "OPTIONS",
                "PATCH",
                "POST",
                "PUT",
                "TRACE",
            ],
            url,
            middlewares = (builder) => builder,
        } = endpoint_;

        const endpointMiddlewares: Array<HttpMiddleware<HttpMethod, any>> = [];
        callInvokable(middlewares, new MiddlewareBuilder(endpointMiddlewares));

        for (const method of methods) {
            const methodLowerCase = method.toLowerCase();

            for (const middleware of this.middlewares) {
                this.router.add(methodLowerCase, url, {
                    type: "middleware",
                    middleware,
                });
            }

            for (const middleware of endpointMiddlewares) {
                this.router.add(methodLowerCase, url, {
                    type: "middleware",
                    middleware,
                });
            }

            this.router.add(methodLowerCase, url, {
                type: "endpoint",
                endpoint: endpoint_,
            });
        }

        return this;
    }

    group(group: HttpRouteGroup): IHttpRouterBase;
    group(prefix: string, group: HttpRouteGroup): IHttpRouterBase;
    group(
        prefixOrGroup: HttpRouteGroup | string,
        group?: HttpRouteGroup,
    ): IHttpRouterBase {
        if (typeof prefixOrGroup === "object") {
            callInvokable(
                prefixOrGroup,
                new HttpRouterBase(
                    this.withPrefix("/"),
                    this.middlewares,
                    this.router,
                ),
            );
            return this;
        }

        if (group !== undefined && typeof prefixOrGroup === "string") {
            callInvokable(
                group,
                new HttpRouterBase(
                    this.withPrefix(prefixOrGroup),
                    this.middlewares,
                    this.router,
                ),
            );
            return this;
        }

        throw new TypeError(
            "Invalid arguments: expected a route group function or a prefix string and group function.",
        );
    }
}

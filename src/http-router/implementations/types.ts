/**
 * @module HttpRouter
 */
import {
    type HttpMiddleware,
    type IHttpEndpoint,
} from "@/http-router/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type MiddlewareEntry = {
    type: "middleware";
    middleware: HttpMiddleware;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type EndpointEntry = {
    type: "endpoint";
    endpoint: IHttpEndpoint;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/http-router"`
 * @group Implementations
 */
export type RouterEntry = MiddlewareEntry | EndpointEntry;

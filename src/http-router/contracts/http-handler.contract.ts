/**
 * @module HttpRouter
 */

import { type IContext } from "@/execution-context/contracts/_module.js";
import { type IHttpReq } from "@/http-router/contracts/http-req.contract.js";
import {
    type IHttpRes,
    type IHttpResHelpers,
} from "@/http-router/contracts/http-res.contract.js";
import {
    type IInvocableObject,
    type InvocableFn,
    type Promisable,
} from "@/utilities/_module.js";

/**
 * The arguments passed to a request handler function or object.
 * Unlike middleware, handlers do not receive a `next` function.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandlerArgs = IHttpResHelpers & {
    /**
     * The incoming HTTP request.
     */
    req: IHttpReq;

    /**
     * The outgoing HTTP response builder.
     */
    res: IHttpRes;

    /**
     * The shared execution context for the request lifecycle.
     */
    context: IContext;
};

/**
 * An invocable object that handles an HTTP request.
 * Receives handler args ({@link HttpHandlerArgs}) and returns a response.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpHandlerObject = IInvocableObject<
    [args: HttpHandlerArgs],
    Promisable<IHttpRes>
>;

/**
 * A function that handles an HTTP request.
 * Receives handler args ({@link HttpHandlerArgs}) and returns a response.
 *
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandlerFn = InvocableFn<
    [args: HttpHandlerArgs],
    Promisable<IHttpRes>
>;

/**
 * A union of all handler forms: a function or an invocable object.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandler = HttpHandlerFn | IHttpHandlerObject;

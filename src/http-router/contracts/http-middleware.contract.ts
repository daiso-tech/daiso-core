/**
 * @module HttpRouter
 */

import {
    type FileInputs,
    type ReqInputs,
    type StringInputs,
} from "@/http-router/contracts/_shared.js";
import { type HttpHandlerArgs } from "@/http-router/contracts/http-handler.contract.js";
import { type HttpMethod } from "@/http-router/contracts/http-req.contract.js";
import { type IHttpRes } from "@/http-router/contracts/http-res.contract.js";
import {
    type IInvokableObject,
    type InvokableFn,
    type Promisable,
} from "@/utilities/_module.js";

/**
 * The next function in the middleware chain.
 * Calling it passes control to the next middleware or the final handler.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpNextFn = InvokableFn<[], Promisable<IHttpRes>>;

/**
 * The arguments passed to a middleware function or object.
 * Extends {@link HttpHandlerArgs} with a `next` function.
 *
 * @typeParam TReqMethod - The HTTP method type.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file upload definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpMiddlewareHandlerArgs<
    TReqMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = HttpHandlerArgs<
    TReqMethod,
    TReqJson,
    TReqFields,
    TReqParams,
    TReqSearchParams,
    TReqHeaders,
    TReqFiles,
    TCookieData
> & {
    /**
     * The next function in the middleware chain.
     */
    next: HttpNextFn;
};

/**
 * An invokable object that acts as HTTP middleware.
 * Receives middleware args (request, context, cookie store, next) and returns a response.
 *
 * @typeParam TReqMethod - The HTTP method type.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file upload definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type IHttpMiddlewareHandlerObject<
    TReqMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = IInvokableObject<
    [
        args: HttpMiddlewareHandlerArgs<
            TReqMethod,
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        >,
    ],
    Promisable<IHttpRes>
>;

/**
 * A function that acts as HTTP middleware.
 * Receives middleware args (request, context, cookie store, next) and returns a response.
 *
 * @typeParam TReqMethod - The HTTP method type.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file upload definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpMiddlewareHandlerFn<
    TReqMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = InvokableFn<
    [
        args: HttpMiddlewareHandlerArgs<
            TReqMethod,
            TReqJson,
            TReqFields,
            TReqParams,
            TReqSearchParams,
            TReqHeaders,
            TReqFiles,
            TCookieData
        >,
    ],
    Promisable<IHttpRes>
>;

/**
 * A union of all middleware forms: a function or an invokable object.
 *
 * @typeParam TReqMethod - The HTTP method type.
 * @typeParam TReqJson - The type of the parsed JSON body.
 * @typeParam TReqFields - The type of the parsed form fields.
 * @typeParam TReqParams - The type of the parsed path parameters.
 * @typeParam TReqSearchParams - The type of the parsed query parameters.
 * @typeParam TReqHeaders - The type of the parsed headers.
 * @typeParam TReqFiles - The expected file upload definitions.
 * @typeParam TCookieData - A record mapping cookie names to their value types.
 *
 * IMPORT_PATH: `"@daiso-tech/core/http-router/contracts"`
 * @group Contracts
 */
export type HttpMiddlewareHandler<
    TReqMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> =
    | HttpMiddlewareHandlerFn<
          TReqMethod,
          TReqJson,
          TReqFields,
          TReqParams,
          TReqSearchParams,
          TReqHeaders,
          TReqFiles,
          TCookieData
      >
    | IHttpMiddlewareHandlerObject<
          TReqMethod,
          TReqJson,
          TReqFields,
          TReqParams,
          TReqSearchParams,
          TReqHeaders,
          TReqFiles,
          TCookieData
      >;

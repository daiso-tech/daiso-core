/**
 * @module HttpRouter
 */

import { type IContext } from "@/execution-context/contracts/_module.js";
import {
    type FileInputs,
    type ReqInputs,
    type StringInputs,
} from "@/http-router/contracts/_shared.js";
import {
    type HttpMethod,
    type IHttpReq,
} from "@/http-router/contracts/http-req.contract.js";
import {
    type IHttpRes,
    type IHttpResHelpers,
} from "@/http-router/contracts/http-res.contract.js";
import {
    type IInvokableObject,
    type InvokableFn,
    type Promisable,
} from "@/utilities/_module.js";

/**
 * The arguments passed to a request handler function or object.
 * Unlike middleware, handlers do not receive a `next` function.
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
export type HttpHandlerArgs<
    TReqMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> = IHttpResHelpers<TCookieData> & {
    /**
     * The incoming HTTP request.
     */
    req: IHttpReq<
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
     * The outgoing HTTP response builder.
     */
    res: IHttpRes<TCookieData>;

    /**
     * The shared execution context for the request lifecycle.
     */
    context: IContext;
};

/**
 * An invokable object that handles an HTTP request.
 * Receives handler args (request, context, cookie store) and returns a response.
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
export type IHttpHandlerObject<
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
        args: HttpHandlerArgs<
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
 * A function that handles an HTTP request.
 * Receives handler args (request, context, cookie store) and returns a response.
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
export type HttpHandlerFn<
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
        args: HttpHandlerArgs<
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
 * A union of all handler forms: a function or an invokable object.
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
export type HttpHandler<
    TReqMethod = HttpMethod,
    TReqJson = unknown,
    TReqFields extends ReqInputs = ReqInputs,
    TReqParams extends ReqInputs = ReqInputs,
    TReqSearchParams extends ReqInputs = ReqInputs,
    TReqHeaders extends ReqInputs = ReqInputs,
    TReqFiles extends FileInputs = FileInputs,
    TCookieData extends StringInputs = StringInputs,
> =
    | HttpHandlerFn<
          TReqMethod,
          TReqJson,
          TReqFields,
          TReqParams,
          TReqSearchParams,
          TReqHeaders,
          TReqFiles,
          TCookieData
      >
    | IHttpHandlerObject<
          TReqMethod,
          TReqJson,
          TReqFields,
          TReqParams,
          TReqSearchParams,
          TReqHeaders,
          TReqFiles,
          TCookieData
      >;

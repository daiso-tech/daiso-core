/**
 * @module HttpRouter
 */
import {
    type FileDef,
    type FileInputs,
    type HttpMethod,
    type HttpMiddleware,
    type IMiddlewareBuilder,
    type ReqInputs,
    type StringInputs,
} from "@/http-router/contracts/_module.js";

/**
 * @internal
 */
export class MiddlewareBuilder implements IMiddlewareBuilder {
    constructor(
        private readonly middlewares: Array<HttpMiddleware<HttpMethod, any>>,
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
    ): IMiddlewareBuilder {
        this.middlewares.push(middleware as HttpMiddleware<HttpMethod, any>);
        return this;
    }
}

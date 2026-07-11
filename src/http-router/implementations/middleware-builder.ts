/**
 * @module HttpRouter
 */
import {
    type HttpMiddleware,
    type IMiddlewareBuilder,
} from "@/http-router/contracts/_module.js";

/**
 * @internal
 */
export class MiddlewareBuilder implements IMiddlewareBuilder {
    constructor(private readonly middlewares: Array<HttpMiddleware>) {}

    use(middleware: HttpMiddleware): IMiddlewareBuilder {
        this.middlewares.push(middleware);
        return this;
    }
}

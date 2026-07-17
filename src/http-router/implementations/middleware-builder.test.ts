/**
 * @module HttpRouter
 */

import { describe, expect, test, vi } from "vitest";

import { type HttpMiddleware } from "@/http-router/contracts/_module.js";
import { MiddlewareBuilder } from "@/http-router/implementations/middleware-builder.js";

describe("class: MiddlewareBuilder", () => {
    describe("method: use", () => {
        test("Should add the middleware to the internal list via push", () => {
            const middlewares: Array<HttpMiddleware> = [];
            const pushSpy = vi.spyOn(middlewares, "push");
            const builder = new MiddlewareBuilder(middlewares);
            const mw = vi.fn() as unknown as HttpMiddleware;

            const result = builder.use(mw);

            expect(pushSpy).toHaveBeenCalledTimes(1);
            expect(pushSpy).toHaveBeenCalledWith(mw);
            expect(result).toBe(builder);
        });

        test("Should return the builder instance for chaining", () => {
            const middlewares: Array<HttpMiddleware> = [];
            const builder = new MiddlewareBuilder(middlewares);
            const mw = vi.fn() as unknown as HttpMiddleware;

            const result = builder.use(mw);

            expect(result).toBe(builder);
        });

        test("Should support chaining multiple middleware calls", () => {
            const middlewares: Array<HttpMiddleware> = [];
            const pushSpy = vi.spyOn(middlewares, "push");
            const builder = new MiddlewareBuilder(middlewares);
            const mw1 = vi.fn() as unknown as HttpMiddleware;
            const mw2 = vi.fn() as unknown as HttpMiddleware;
            const mw3 = vi.fn() as unknown as HttpMiddleware;

            builder.use(mw1).use(mw2).use(mw3);

            expect(pushSpy).toHaveBeenCalledTimes(3);
            expect(pushSpy).toHaveBeenNthCalledWith(1, mw1);
            expect(pushSpy).toHaveBeenNthCalledWith(2, mw2);
            expect(pushSpy).toHaveBeenNthCalledWith(3, mw3);
        });

        test("Should add middleware in insertion order", () => {
            const middlewares: Array<HttpMiddleware> = [];
            const builder = new MiddlewareBuilder(middlewares);
            const mw1 = vi.fn() as unknown as HttpMiddleware;
            const mw2 = vi.fn() as unknown as HttpMiddleware;
            const mw3 = vi.fn() as unknown as HttpMiddleware;

            builder.use(mw1);
            builder.use(mw2);
            builder.use(mw3);

            expect(middlewares[0]).toBe(mw1);
            expect(middlewares[1]).toBe(mw2);
            expect(middlewares[2]).toBe(mw3);
        });
    });
});

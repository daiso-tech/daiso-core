/**
 * @module HttpRouter
 */

import { type Router, type Result } from "hono/router";
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { describe, expect, test, vi } from "vitest";

import { type HttpMiddleware } from "@/http-router/contracts/_module.js";
import { HttpRouterBase } from "@/http-router/implementations/http-router-base.js";
import { type RouterEntry } from "@/http-router/implementations/types.js";

function createMockRouter(): Router<RouterEntry> {
    return {
        name: "mock",
        add: vi.fn(),
        match: vi.fn((): Result<RouterEntry> => [[], [] as Array<string>]),
    };
}

function createMockMiddleware(): HttpMiddleware {
    return vi.fn() as unknown as HttpMiddleware;
}

describe("class: HttpRouterBase", () => {
    describe("method: use", () => {
        test("Should add middleware and return the instance for chaining", () => {
            const router = createMockRouter();
            const base = new HttpRouterBase("/", [], router);
            const mw = createMockMiddleware();

            const result = base.use(mw);

            expect(result).toBe(base);
        });
    });

    describe("method: endpoint", () => {
        test("Should register routes for all default HTTP methods via router.add", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/prefix", [], mockRouter);

            base.endpoint({
                url: "/users",
                handler: vi.fn() as never,
            });

            expect(addSpy).toHaveBeenCalled();
            const methods = addSpy.mock.calls.map((call) => call[0]);
            expect(methods).toContain("get");
            expect(methods).toContain("post");
            expect(methods).toContain("put");
            expect(methods).toContain("delete");
            expect(methods).toContain("patch");
        });

        test("Should register only the specified HTTP method", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/health",
                method: ["GET"],
                handler: vi.fn() as never,
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls).toHaveLength(1);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            expect(endpointCalls[0]?.[0]).toBe("get");
        });

        test("Should register endpoint-specific middlewares before the endpoint entry", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);
            const epMw = createMockMiddleware();

            base.endpoint({
                url: "/test",
                method: ["GET"],
                handler: vi.fn() as never,
                middlewares: (builder) => builder.use(epMw),
            });

            const types = addSpy.mock.calls.map((call) => call[2].type);
            const lastType = types[types.length - 1];
            expect(lastType).toBe("endpoint");
            expect(types.slice(0, -1).every((t) => t === "middleware")).toBe(
                true,
            );
        });

        test("Should return the instance for chaining", () => {
            const router = createMockRouter();
            const base = new HttpRouterBase("/", [], router);
            const result = base.endpoint({
                url: "/test",
                handler: vi.fn() as never,
            });
            expect(result).toBe(base);
        });
    });

    describe("method: endpoint > routing patterns", () => {
        test("Should register PUT method for an endpoint", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/resource",
                method: ["PUT"],
                handler: vi.fn() as never,
            });

            const endpointMethods = addSpy.mock.calls
                .filter((call) => call[2].type === "endpoint")
                .map((call) => call[0]);
            expect(endpointMethods).toEqual(["put"]);
        });

        test("Should register DELETE method for an endpoint", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/resource",
                method: ["DELETE"],
                handler: vi.fn() as never,
            });

            const endpointMethods = addSpy.mock.calls
                .filter((call) => call[2].type === "endpoint")
                .map((call) => call[0]);
            expect(endpointMethods).toEqual(["delete"]);
        });

        test("Should register multiple HTTP methods for the same endpoint", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/all-methods",
                method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                handler: vi.fn() as never,
            });

            const endpointMethods = addSpy.mock.calls
                .filter((call) => call[2].type === "endpoint")
                .map((call) => call[0]);
            expect(endpointMethods).toEqual([
                "get",
                "post",
                "put",
                "delete",
                "patch",
            ]);
        });

        test("Should register a custom HTTP method like PURGE", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/cache",
                method: ["PURGE"],
                handler: vi.fn() as never,
            });

            const endpointMethods = addSpy.mock.calls
                .filter((call) => call[2].type === "endpoint")
                .map((call) => call[0]);
            expect(endpointMethods).toEqual(["purge"]);
        });

        test("Should register a wildcard URL pattern", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/wild/*/card",
                method: ["GET"],
                handler: vi.fn() as never,
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls[0]?.[1]).toBe("/wild/*/card");
        });

        test("Should register an optional parameter URL pattern", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/api/animal/:type?",
                method: ["GET"],
                handler: vi.fn() as never,
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls[0]?.[1]).toBe("/api/animal/:type?");
        });

        test("Should register a URL with path parameters", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/users/:id/posts/:postId",
                method: ["GET"],
                handler: vi.fn() as never,
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls[0]?.[1]).toBe("/users/:id/posts/:postId");
        });

        test("Should register a URL with regexp-constrained parameters", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/post/:date{[0-9]+}/:title{[a-z]+}",
                method: ["GET"],
                handler: vi.fn() as never,
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls[0]?.[1]).toBe(
                "/post/:date{[0-9]+}/:title{[a-z]+}",
            );
        });

        test("Should register a URL with regexp including slashes", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/posts/:filename{.+\\.png}",
                method: ["GET"],
                handler: vi.fn() as never,
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls[0]?.[1]).toBe("/posts/:filename{.+\\.png}");
        });

        test("Should register a deep wildcard URL pattern", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/static/*",
                method: ["GET"],
                handler: vi.fn() as never,
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls[0]?.[1]).toBe("/static/*");
        });

        test("Should register middleware for each specified method", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.endpoint({
                url: "/test",
                method: ["GET", "POST"],
                handler: vi.fn() as never,
                middlewares: (builder) =>
                    builder.use(vi.fn() as unknown as HttpMiddleware),
            });

            const middlewareCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "middleware",
            );
            // 1 middleware registered for each of 2 methods
            expect(middlewareCalls).toHaveLength(2);
            expect(middlewareCalls[0]?.[0]).toBe("get");
            expect(middlewareCalls[1]?.[0]).toBe("post");
        });

        test("Should propagate shared middlewares for each method", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase(
                "/",
                [vi.fn() as unknown as HttpMiddleware],
                mockRouter,
            );

            base.endpoint({
                url: "/shared",
                method: ["GET", "POST"],
                handler: vi.fn() as never,
            });

            const middlewareCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "middleware",
            );
            // 1 shared middleware for each of 2 methods
            expect(middlewareCalls).toHaveLength(2);
        });
    });

    describe("method: group", () => {
        test("Should invoke the group function with a sub-router (no prefix)", () => {
            const router = createMockRouter();
            const base = new HttpRouterBase("/", [], router);

            const groupFn = vi.fn();
            base.group((subRouter) => groupFn(subRouter));

            expect(groupFn).toHaveBeenCalledTimes(1);
            expect(groupFn).toHaveBeenCalledWith(expect.any(HttpRouterBase));
        });

        test("Should invoke the group function with a sub-router having a prefix", () => {
            const router = createMockRouter();
            const base = new HttpRouterBase("/api", [], router);

            const groupFn = vi.fn();
            base.group("/v1", (subRouter) => groupFn(subRouter));

            expect(groupFn).toHaveBeenCalledTimes(1);
            expect(groupFn).toHaveBeenCalledWith(expect.any(HttpRouterBase));
        });

        test("Should return the instance for chaining", () => {
            const router = createMockRouter();
            const base = new HttpRouterBase("/", [], router);
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const result = base.group(() => {});
            expect(result).toBe(base);
        });

        test("Should throw TypeError when invalid arguments are passed", () => {
            const router = createMockRouter();
            const base = new HttpRouterBase("/", [], router);

            expect(() =>
                (base as never as { group: (arg: unknown) => unknown }).group(
                    undefined,
                ),
            ).toThrow(TypeError);
        });

        test("Should allow registering endpoints within a group via the sub-router", () => {
            const addSpy = vi.fn();
            const mockRouter: Router<RouterEntry> = {
                name: "mock",
                add: addSpy,
                match: vi.fn(
                    (): Result<RouterEntry> => [[], [] as Array<string>],
                ),
            };
            const base = new HttpRouterBase("/", [], mockRouter);

            base.group((subRouter) => {
                subRouter.endpoint({
                    url: "/nested",
                    method: ["GET"],
                    handler: vi.fn() as never,
                });
            });

            const endpointCalls = addSpy.mock.calls.filter(
                (call) => call[2].type === "endpoint",
            );
            expect(endpointCalls).toHaveLength(1);
        });
    });
});

/**
 * @module HttpRouter
 */

/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import { describe, expect, test, vi } from "vitest";

import { HttpError } from "@/http-router/contracts/http.errors.js";
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@/http-router/implementations/http-router.js";
import { type RouterEntry } from "@/http-router/implementations/types.js";

function createRouter() {
    return new HttpRouter({
        router: new SmartRouter<RouterEntry>({
            routers: [new RegExpRouter(), new TrieRouter()],
        }),
    });
}

describe("class: HttpRouter", () => {
    describe("constructor", () => {
        test("Should create an HttpRouter with a fetch handler", () => {
            const router = createRouter();
            expect(router.fetch).toBeDefined();
            expect(typeof router.fetch).toBe("function");
        });

        test("Should accept custom router adapter", () => {
            const customRouter = new SmartRouter<RouterEntry>({
                routers: [new RegExpRouter(), new TrieRouter()],
            });
            const router = new HttpRouter({ router: customRouter });
            expect(router.fetch).toBeDefined();
        });

        test("Should accept middlewares in settings", () => {
            const router = new HttpRouter({
                router: defaultHttpRouterAdapter,
                middlewares: async (_req, next) => {
                    return await next(_req);
                },
            });

            router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: async () => {
                    return {
                        buildWebRes: () => new Response("ok", { status: 200 }),
                    } as never;
                },
            });

            // Verify the router was created without errors
            expect(router.fetch).toBeDefined();
        });
    });

    describe("method: endpoint", () => {
        test("Should delegate to the base router and register the endpoint", () => {
            const router = createRouter();
            const result = router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: vi.fn() as never,
            });
            expect(result).toBe(router["httpRouterBase"]);
        });
    });

    describe("method: use", () => {
        test("Should register middleware on the base router", () => {
            const router = createRouter();
            const mw = vi.fn() as unknown as never;
            const result = router.use(mw);
            expect(result).toBeDefined();
        });
    });

    describe("method: group", () => {
        test("Should return the router instance for chaining", () => {
            const httpRouterBase = createRouter();
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const result = httpRouterBase.group(() => {});
            expect(result).toBeDefined();
        });

        test("Should throw TypeError for invalid arguments", () => {
            const router = createRouter();
            expect(() =>
                (router as never as { group: (arg: unknown) => unknown }).group(
                    undefined,
                ),
            ).toThrow(TypeError);
        });
    });

    describe("fetch: basic routing", () => {
        test("Should return 404 for unmatched routes", async () => {
            const router = createRouter();
            const request = new Request("https://test.local/unknown");
            const response = await router.fetch(request);
            expect(response.status).toBe(404);
        });

        test("Should route a GET request to the correct endpoint", async () => {
            const router = createRouter();
            const handlerSpy = vi.fn(async ({ text }) => text("Hello World"));
            router.endpoint({
                url: "/hello",
                method: ["GET"],
                handler: handlerSpy,
            });

            const request = new Request("https://test.local/hello");
            const response = await router.fetch(request);
            expect(handlerSpy).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("Hello World");
        });

        test("Should route a POST request to the correct endpoint", async () => {
            const router = createRouter();
            const handlerSpy = vi.fn(async ({ text }) => text("Created"));
            router.endpoint({
                url: "/submit",
                method: ["POST"],
                handler: handlerSpy,
            });

            const request = new Request("https://test.local/submit", {
                method: "POST",
            });
            const response = await router.fetch(request);
            expect(handlerSpy).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
        });

        test("Should extract path parameters", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/users/:id",
                method: ["GET"],
                handler: async ({ req }) => {
                    const params = req.rawParams();
                    return {
                        buildWebRes: () =>
                            new Response(JSON.stringify(params), {
                                status: 200,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            }),
                    } as never;
                },
            });

            const request = new Request("https://test.local/users/42");
            const response = await router.fetch(request);
            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toHaveProperty("id", "42");
        });

        test("Should handle multiple path parameters", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/orgs/:orgId/repos/:repoId",
                method: ["GET"],
                handler: async ({ req }) => {
                    const params = req.rawParams();
                    return {
                        buildWebRes: () =>
                            new Response(JSON.stringify(params), {
                                status: 200,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            }),
                    } as never;
                },
            });

            const request = new Request(
                "https://test.local/orgs/myorg/repos/myrepo",
            );
            const response = await router.fetch(request);
            const body = await response.json();
            expect(body).toEqual({
                orgId: "myorg",
                repoId: "myrepo",
            });
        });

        test("Should return JSON responses correctly", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/api/data",
                method: ["GET"],
                handler: async ({ json }) => {
                    return json({ message: "success", code: 200 });
                },
            });

            const request = new Request("https://test.local/api/data");
            const response = await router.fetch(request);
            expect(response.status).toBe(200);
            expect(response.headers.get("Content-Type")).toBe(
                "application/json",
            );
            const body = await response.json();
            expect(body).toEqual({ message: "success", code: 200 });
        });
    });

    describe("fetch: routing patterns", () => {
        test("Should handle PUT method on the same path", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/resource",
                method: ["PUT"],
                handler: async ({ text }) => text("PUT /resource"),
            });
            const response = await router.fetch(
                new Request("https://test.local/resource", { method: "PUT" }),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("PUT /resource");
        });

        test("Should handle DELETE method on the same path", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/resource",
                method: ["DELETE"],
                handler: async ({ text }) => text("DELETE /resource"),
            });
            const response = await router.fetch(
                new Request("https://test.local/resource", {
                    method: "DELETE",
                }),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("DELETE /resource");
        });

        test("Should handle all method endpoint via GET", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/all-methods",
                method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                handler: async ({ text }) => text("Any Method /all-methods"),
            });
            const response = await router.fetch(
                new Request("https://test.local/all-methods", {
                    method: "PATCH",
                }),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("Any Method /all-methods");
        });

        test("Should handle custom HTTP methods like PURGE", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/cache",
                method: ["PURGE"],
                handler: async ({ text }) => text("PURGE Method /cache"),
            });
            const response = await router.fetch(
                new Request("https://test.local/cache", { method: "PURGE" }),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("PURGE Method /cache");
        });

        test("Should handle wildcard path segments", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/wild/*/card",
                method: ["GET"],
                handler: async ({ text }) => text("GET /wild/*/card"),
            });
            const response = await router.fetch(
                new Request("https://test.local/wild/anything/card"),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("GET /wild/*/card");
        });

        test("Should handle optional path parameters (present)", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/api/animal/:type?",
                method: ["GET"],
                handler: async ({ text }) => text("Animal!"),
            });
            const response = await router.fetch(
                new Request("https://test.local/api/animal/dog"),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("Animal!");
        });

        test("Should handle optional path parameters (absent)", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/api/animal/:type?",
                method: ["GET"],
                handler: async ({ text }) => text("Animal!"),
            });
            const response = await router.fetch(
                new Request("https://test.local/api/animal"),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("Animal!");
        });

        test("Should extract parameters with numeric constraints", async () => {
            // RegExpRouter supports placeholder patterns like :id([0-9]+)
            const router = new HttpRouter({
                router: new SmartRouter<RouterEntry>({
                    routers: [new RegExpRouter(), new TrieRouter()],
                }),
            });
            router.endpoint({
                url: "/post/:id",
                method: ["GET"],
                handler: async ({ req, json }) => json(req.rawParams()),
            });
            const response = await router.fetch(
                new Request("https://test.local/post/42"),
            );
            expect(response.status).toBe(200);
            const body = (await response.json()) as Record<string, string>;
            expect(body).toEqual({ id: "42" });
        });

        test("Should handle path parameters with slashes using regexp", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/posts/:filename{.+\\.png}",
                method: ["GET"],
                handler: async ({ req, json }) => json(req.rawParams()),
            });
            const response = await router.fetch(
                new Request("https://test.local/posts/path/to/image.png"),
            );
            expect(response.status).toBe(200);
            const body = (await response.json()) as Record<string, string>;
            expect(body).toHaveProperty("filename");
            expect(body["filename"]).toMatch(/\.png$/);
        });

        test("Should handle deep wildcard with trailing path", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/static/*",
                method: ["GET"],
                handler: async ({ text }) => text("static file"),
            });
            const response = await router.fetch(
                new Request("https://test.local/static/js/app.js"),
            );
            expect(response.status).toBe(200);
            expect(await response.text()).toBe("static file");
        });

        test("Should return 404 when POST to a GET-only route", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/get-only",
                method: ["GET"],
                handler: async ({ text }) => text("only GET"),
            });
            const response = await router.fetch(
                new Request("https://test.local/get-only", {
                    method: "POST",
                }),
            );
            expect(response.status).toBe(404);
        });

        test("Should return 404 when GET to a POST-only route", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/post-only",
                method: ["POST"],
                handler: async ({ text }) => text("only POST"),
            });
            const response = await router.fetch(
                new Request("https://test.local/post-only"),
            );
            expect(response.status).toBe(404);
        });
    });

    describe("fetch: middleware execution", () => {
        test("Should execute router-level middleware before the handler", async () => {
            const executionOrder: Array<string> = [];
            const router = new HttpRouter({
                router: new SmartRouter<RouterEntry>({
                    routers: [new RegExpRouter(), new TrieRouter()],
                }),
                middlewares: async (req, next) => {
                    executionOrder.push("middleware-before");
                    const res = await next(req);
                    executionOrder.push("middleware-after");
                    return res;
                },
            });

            router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: async ({ text }) => {
                    executionOrder.push("handler");
                    return text("ok");
                },
            });

            const request = new Request("https://test.local/test");
            await router.fetch(request);

            expect(executionOrder).toEqual([
                "middleware-before",
                "handler",
                "middleware-after",
            ]);
        });

        test("Should execute endpoint-level middleware in order", async () => {
            const executionOrder: Array<string> = [];
            const router = createRouter();

            router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: async ({ text }) => {
                    executionOrder.push("handler");
                    return text("ok");
                },
                middlewares: (builder) =>
                    builder
                        .use(async ({ next }) => {
                            executionOrder.push("mw1");
                            return await next();
                        })
                        .use(async ({ next }) => {
                            executionOrder.push("mw2");
                            return await next();
                        }),
            });

            const request = new Request("https://test.local/test");
            await router.fetch(request);

            expect(executionOrder).toEqual(["mw1", "mw2", "handler"]);
        });

        test("Should allow middleware to short-circuit and skip the handler", async () => {
            const handlerSpy = vi.fn();
            const router = new HttpRouter({
                router: new SmartRouter<RouterEntry>({
                    routers: [new RegExpRouter(), new TrieRouter()],
                }),
                middlewares: async (_req, _next) => {
                    return new Response("blocked", { status: 403 });
                },
            });

            router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: handlerSpy as never,
            });

            const request = new Request("https://test.local/test");
            const response = await router.fetch(request);
            expect(handlerSpy).not.toHaveBeenCalled();
            expect(response.status).toBe(403);
            expect(await response.text()).toBe("blocked");
        });

        test("Should execute shared middleware for all endpoints in the group", async () => {
            const executionOrder: Array<string> = [];
            const router = createRouter();
            router.use(async ({ next }) => {
                executionOrder.push("shared-mw");
                return await next();
            });

            router.endpoint({
                url: "/a",
                method: ["GET"],
                handler: async ({ text }) => {
                    executionOrder.push("handler-a");
                    return text("a");
                },
            });

            router.endpoint({
                url: "/b",
                method: ["GET"],
                handler: async ({ text }) => {
                    executionOrder.push("handler-b");
                    return text("b");
                },
            });

            await router.fetch(new Request("https://test.local/a"));
            expect(executionOrder).toEqual(["shared-mw", "handler-a"]);

            executionOrder.length = 0;
            await router.fetch(new Request("https://test.local/b"));
            expect(executionOrder).toEqual(["shared-mw", "handler-b"]);
        });
    });

    describe("fetch: context", () => {
        test("Should provide a shared context accessible to middleware and handler", async () => {
            const router = new HttpRouter({
                router: new SmartRouter<RouterEntry>({
                    routers: [new RegExpRouter(), new TrieRouter()],
                }),
                middlewares: async (req, next) => {
                    const res = await next(req);
                    res.headers.set("X-MW-Ran", "true");
                    return res;
                },
            });

            router.endpoint({
                url: "/context",
                method: ["GET"],
                handler: async ({ context, text }) => {
                    context.add({ id: "request-id" } as never, "abc-123");
                    return text(
                        context.get({ id: "request-id" } as never) as string,
                    );
                },
            });

            const request = new Request("https://test.local/context");
            const response = await router.fetch(request);
            expect(await response.text()).toBe("abc-123");
        });
    });

    describe("fetch: error handling", () => {
        test("Should return 500 for non-HttpError thrown from handler", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/error",
                method: ["GET"],
                handler: async () => {
                    throw new Error("handler error");
                },
            });

            const request = new Request("https://test.local/error");
            const response = await router.fetch(request);
            expect(response.status).toBe(500);
            expect(await response.text()).toBe("Unexpected error occurred");
        });

        test("Should return structured JSON for HttpError thrown from handler", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/secure",
                method: ["GET"],
                handler: async () => {
                    throw HttpError.create({
                        status: "403",
                        message: "Forbidden",
                        cause: null,
                    });
                },
            });

            const request = new Request("https://test.local/secure");
            const response = await router.fetch(request);
            expect(response.status).toBe(200);
            expect(response.headers.get("Content-Type")).toBe(
                "application/json",
            );
            const body = await response.json();
            expect(body).toMatchObject({
                name: "HttpError",
                status: "403",
                message: "Forbidden",
            });
        });

        test("Should return 500 for non-HttpError thrown from endpoint middleware", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/mw-error",
                method: ["GET"],
                handler: async ({ text }) => text("ok"),
                middlewares: (builder) =>
                    builder.use(async () => {
                        throw new TypeError("middleware failure");
                    }),
            });

            const request = new Request("https://test.local/mw-error");
            const response = await router.fetch(request);
            expect(response.status).toBe(500);
            expect(await response.text()).toBe("Unexpected error occurred");
        });
    });

    describe("fetch: response helpers", () => {
        test("Should support redirect helper", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/old",
                method: ["GET"],
                handler: async ({ redirect }) => {
                    return redirect("/new");
                },
            });

            const request = new Request("https://test.local/old");
            const response = await router.fetch(request);
            expect(response.status).toBe(302);
            expect(response.headers.get("Location")).toBe("/new");
        });

        test("Should support permanentRedirect helper", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/old-permanent",
                method: ["GET"],
                handler: async ({ permanentRedirect }) => {
                    return permanentRedirect("/new-permanent");
                },
            });

            const request = new Request("https://test.local/old-permanent");
            const response = await router.fetch(request);
            expect(response.status).toBe(301);
            expect(response.headers.get("Location")).toBe("/new-permanent");
        });

        test("Should support html helper", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/page",
                method: ["GET"],
                handler: async ({ html }) => {
                    return html("<h1>Title</h1>");
                },
            });

            const request = new Request("https://test.local/page");
            const response = await router.fetch(request);
            expect(response.status).toBe(200);
            expect(response.headers.get("Content-Type")).toBe("text/html");
            expect(await response.text()).toBe("<h1>Title</h1>");
        });

        test("Should support notFound helper", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/maybe",
                method: ["GET"],
                handler: async ({ notFound }) => {
                    return notFound();
                },
            });

            const request = new Request("https://test.local/maybe");
            const response = await router.fetch(request);
            expect(response.status).toBe(404);
        });
    });

    describe("fetch: query parameters", () => {
        test("Should pass query parameters to the handler", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/search",
                method: ["GET"],
                handler: async ({ req }) => {
                    const sp = req.rawSearchParams();
                    return {
                        buildWebRes: () =>
                            new Response(JSON.stringify(sp), {
                                status: 200,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            }),
                    } as never;
                },
            });

            const request = new Request(
                "https://test.local/search?q=hello&page=2",
            );
            const response = await router.fetch(request);
            const body = await response.json();
            expect(body).toEqual({ q: "hello", page: "2" });
        });
    });

    describe("integration: full request lifecycle", () => {
        test("Should handle a complete request with middleware, params, query, and JSON response", async () => {
            const router = new HttpRouter({
                router: new SmartRouter<RouterEntry>({
                    routers: [new RegExpRouter(), new TrieRouter()],
                }),
                middlewares: async (req, next) => {
                    const start = Date.now();
                    const res = await next(req);
                    res.headers.set(
                        "X-Response-Time",
                        String(Date.now() - start),
                    );
                    return res;
                },
            });

            router.endpoint({
                url: "/api/v1/users/:id",
                method: ["GET"],
                handler: async ({ req, json }) => {
                    const params = req.rawParams();
                    const searchParams = req.rawSearchParams();
                    return json({
                        id: params["id"],
                        include: searchParams["include"],
                    });
                },
            });

            const request = new Request(
                "https://test.local/api/v1/users/42?include=profile",
            );
            const response = await router.fetch(request);

            expect(response.status).toBe(200);
            expect(response.headers.get("Content-Type")).toBe(
                "application/json",
            );
            expect(response.headers.get("X-Response-Time")).toBeDefined();

            const body = await response.json();
            expect(body).toEqual({ id: "42", include: "profile" });
        });
    });
});

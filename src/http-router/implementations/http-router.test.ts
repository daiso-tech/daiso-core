/**
 * @module HttpRouter
 */

/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */

import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { contextToken } from "@/execution-context/contracts/execution-context.contract.js";
import { FileSize } from "@/file-size/implementations/_module.js";
import { HttpError } from "@/http-router/contracts/http.errors.js";
import { HttpRouter } from "@/http-router/implementations/http-router.js";

import type { Router } from "hono/router";

import type {
    HttpHandlerFn,
    HttpMiddlewareFn,
} from "@/http-router/contracts/_module.js";
import type { RouterEntry } from "@/http-router/implementations/types.js";

function createHonoRouter(): Router<RouterEntry> {
    return new SmartRouter<RouterEntry>({
        routers: [new RegExpRouter(), new TrieRouter()],
    });
}

describe("class: HttpRouter", () => {
    describe("constructor", () => {
        test("Should create an HttpRouter with a fetch handler", () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
                router: createHonoRouter(),
                middlewares: async (_req, next) => {
                    return await next(_req);
                },
            });

            router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: async ({ res }) => {
                    return res.setStatus("200").setBody("ok");
                },
            });

            // Verify the router was created without errors
            expect(router.fetch).toBeDefined();
        });
    });
    describe("method: endpoint", () => {
        test("Should delegate to the base router and register the endpoint", () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
            const result = router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: vi.fn<HttpHandlerFn>(),
            });
            expect(result).toBe(router["httpRouterBase"]);
        });
    });
    describe("method: use", () => {
        test("Should register middleware on the base router", () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
            const mw = vi.fn<HttpMiddlewareFn>();
            const result = router.use(mw);
            expect(result).toBeDefined();
        });
    });
    describe("method: group", () => {
        test("Should return the router instance for chaining", () => {
            const httpRouterBase = new HttpRouter({
                router: createHonoRouter(),
            });
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const result = httpRouterBase.group(() => {});
            expect(result).toBeDefined();
        });
        test("Should throw TypeError for invalid arguments", () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
            expect(() =>
                (router as { group: (arg: unknown) => unknown }).group(
                    undefined,
                ),
            ).toThrow(TypeError);
        });
    });
    describe("fetch: basic routing", () => {
        test("Should return 404 for unmatched routes", async () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
            const request = new Request("https://test.local/unknown");
            const response = await router.fetch(request);
            expect(response.status).toBe(404);
        });
        test("Should route a GET request to the correct endpoint", async () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
        test("Should return JSON responses correctly", async () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
                handler: async ({ req, json }) => json(req.params()),
            });
            const response = await router.fetch(
                new Request("https://test.local/post/42"),
            );
            expect(response.status).toBe(200);
            const body = (await response.json()) as Record<string, string>;
            expect(body).toEqual({ id: "42" });
        });
        test("Should handle path parameters with slashes using regexp", async () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
            router.endpoint({
                url: "/posts/:filename{.+\\.png}",
                method: ["GET"],
                handler: async ({ req, json }) => json(req.params()),
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
                router: createHonoRouter(),
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });

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
                router: createHonoRouter(),
                middlewares: async (_req, _next) => {
                    return new Response("blocked", { status: 403 });
                },
            });

            router.endpoint({
                url: "/test",
                method: ["GET"],
                handler: handlerSpy,
            });

            const request = new Request("https://test.local/test");
            const response = await router.fetch(request);
            expect(handlerSpy).not.toHaveBeenCalled();
            expect(response.status).toBe(403);
            expect(await response.text()).toBe("blocked");
        });
        test("Should execute shared middleware for all endpoints in the group", async () => {
            const executionOrder: Array<string> = [];
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
                router: createHonoRouter(),
                middlewares: async (req, next) => {
                    const res = await next(req);
                    res.headers.set("X-MW-Ran", "true");
                    return res;
                },
            });

            const requestId = contextToken<string>("request-id");
            router.endpoint({
                url: "/context",
                method: ["GET"],
                handler: async ({ context, text }) => {
                    context.add(requestId, "abc-123");
                    return text(context.getOrFail(requestId));
                },
            });

            const request = new Request("https://test.local/context");
            const response = await router.fetch(request);
            expect(await response.text()).toBe("abc-123");
        });
    });
    describe("fetch: error handling", () => {
        test("Should return 500 for non-HttpError thrown from handler", async () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
            const router = new HttpRouter({
                router: createHonoRouter(),
            });
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
    describe("integration: full request lifecycle", () => {
        test("Should handle a complete request with middleware, params, query, and JSON response", async () => {
            const router = new HttpRouter({
                router: createHonoRouter(),
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
                    const params = req.params();
                    const searchParams = req.searchParams();
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
    describe("fetch: request data access", () => {
        function createFile(
            name = "avatar.png",
            type = "image/png",
            content = "file content",
        ): File {
            return new File([new TextEncoder().encode(content)], name, {
                type,
            });
        }
        function createFormRequest(
            files: Record<string, File | Array<File>> = {},
        ): Request {
            const formData = new FormData();
            for (const [field, file] of Object.entries(files)) {
                if (Array.isArray(file)) {
                    for (const item of file) {
                        formData.append(field, item);
                    }
                } else {
                    formData.set(field, file);
                }
            }
            return new Request("https://test.local/upload", {
                method: "POST",
                body: formData,
            });
        }

        describe("property: method", () => {
            test("Should expose the request method", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/info",
                    method: ["DELETE"],
                    handler: async ({ req, json }) =>
                        json({ method: req.method }),
                });

                const response = await router.fetch(
                    new Request("https://test.local/info", {
                        method: "DELETE",
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ method: "DELETE" });
            });
        });
        describe("property: url", () => {
            test("Should expose the full request URL", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/info",
                    method: ["GET"],
                    handler: async ({ req, json }) => json({ url: req.url }),
                });

                const response = await router.fetch(
                    new Request("https://test.local/info?query=1"),
                );
                const body = await response.json();
                expect(body).toEqual({
                    url: "https://test.local/info?query=1",
                });
            });
        });
        describe("property: signal", () => {
            test("Should expose the request signal", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/info",
                    method: ["GET"],
                    handler: async ({ req, json }) =>
                        json({
                            isAbortSignal: req.signal instanceof AbortSignal,
                            aborted: req.signal.aborted,
                        }),
                });

                const response = await router.fetch(
                    new Request("https://test.local/info"),
                );
                const body = await response.json();
                expect(body).toEqual({ isAbortSignal: true, aborted: false });
            });
        });
        describe("property: webReq", () => {
            test("Should expose the underlying Request object", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/info",
                    method: ["GET"],
                    handler: async ({ req, json }) =>
                        json({ isRequest: req.webReq instanceof Request }),
                });

                const response = await router.fetch(
                    new Request("https://test.local/info"),
                );
                const body = await response.json();
                expect(body).toEqual({ isRequest: true });
            });
        });
        describe("property: readableStream", () => {
            test("Should expose null for a GET request with no body", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/info",
                    method: ["GET"],
                    handler: async ({ req, json }) =>
                        json({ isNull: req.readableStream === null }),
                });

                const response = await router.fetch(
                    new Request("https://test.local/info"),
                );
                const body = await response.json();
                expect(body).toEqual({ isNull: true });
            });
            test("Should expose a ReadableStream for a request with a body", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/info",
                    method: ["POST"],
                    handler: async ({ req, json }) =>
                        json({
                            isReadableStream:
                                req.readableStream instanceof ReadableStream,
                        }),
                });

                const response = await router.fetch(
                    new Request("https://test.local/info", {
                        method: "POST",
                        body: "data",
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ isReadableStream: true });
            });
        });
        describe("method: cookies", () => {
            test("Should parse cookies from the request", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/cookies",
                    method: ["GET"],
                    handler: async ({ req, json }) => json(req.cookies()),
                });

                const response = await router.fetch(
                    new Request("https://test.local/cookies", {
                        headers: { Cookie: "session=abc123" },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ session: "abc123" });
            });
            test("Should validate cookies against a schema", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/cookies",
                    method: ["GET"],
                    handler: async ({ req, json }) =>
                        json(req.cookies(z.object({ session: z.string() }))),
                });

                const response = await router.fetch(
                    new Request("https://test.local/cookies", {
                        headers: { Cookie: "session=abc123" },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ session: "abc123" });
            });
            test("Should return a 400 status when cookie validation fails", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/cookies",
                    method: ["GET"],
                    handler: async ({ req, text }) => {
                        req.cookies(z.object({ session: z.string().min(10) }));
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/cookies", {
                        headers: { Cookie: "session=abc123" },
                    }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
        });
        describe("method: json", () => {
            test("Should parse the request body as JSON", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/json",
                    method: ["POST"],
                    handler: async ({ req, json }) => json(await req.json()),
                });

                const response = await router.fetch(
                    new Request("https://test.local/json", {
                        method: "POST",
                        body: JSON.stringify({ key: "value" }),
                        headers: { "Content-Type": "application/json" },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ key: "value" });
            });
            test("Should validate the JSON body against a schema", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/api",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const body = await req.json(
                            z.object({ name: z.string() }),
                        );
                        return json(body);
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/api", {
                        method: "POST",
                        body: JSON.stringify({ name: "Jane" }),
                        headers: { "Content-Type": "application/json" },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ name: "Jane" });
            });
        });
        describe("method: params", () => {
            test("Should extract path parameters", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/users/:id",
                    method: ["GET"],
                    handler: async ({ req, json }) => {
                        const params = req.params();
                        return json(params).setStatus(200);
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/users/42"),
                );
                const body = await response.json();
                expect(body).toHaveProperty("id", "42");
            });
            test("Should handle multiple path parameters", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/orgs/:orgId/repos/:repoId",
                    method: ["GET"],
                    handler: async ({ req, json }) => {
                        const params = req.params();
                        return json(params).setStatus(200);
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/orgs/myorg/repos/myrepo"),
                );
                const body = await response.json();
                expect(body).toEqual({
                    orgId: "myorg",
                    repoId: "myrepo",
                });
            });
            test("Should validate path parameters against a schema", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/users/:id",
                    method: ["GET"],
                    handler: async ({ req, json }) =>
                        json(req.params(z.object({ id: z.string() }))),
                });

                const response = await router.fetch(
                    new Request("https://test.local/users/42"),
                );
                const body = await response.json();
                expect(body).toEqual({ id: "42" });
            });
            test("Should return a 400 status when schema validation fails", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/users/:id",
                    method: ["GET"],
                    handler: async ({ req, text }) => {
                        req.params(z.object({ id: z.string().min(5) }));
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/users/42"),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
        });
        describe("method: searchParams", () => {
            test("Should pass query parameters to the handler", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/search",
                    method: ["GET"],
                    handler: async ({ req, json }) => {
                        const sp = req.searchParams();
                        return json(sp).setStatus(200);
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/search?q=hello&page=2"),
                );
                const body = await response.json();
                expect(body).toEqual({ q: "hello", page: "2" });
            });
            test("Should validate query parameters against a schema", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/search",
                    method: ["GET"],
                    handler: async ({ req, json }) => {
                        const sp = req.searchParams(
                            z.object({ q: z.string() }),
                        );
                        return json(sp);
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/search?q=hello"),
                );
                const body = await response.json();
                expect(body).toEqual({ q: "hello" });
            });
        });
        describe("method: headers", () => {
            test("Should return all request headers", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/headers",
                    method: ["GET"],
                    handler: async ({ req, json }) =>
                        json({ "x-custom": req.headers()["x-custom"] }),
                });

                const response = await router.fetch(
                    new Request("https://test.local/headers", {
                        headers: { "x-custom": "myvalue" },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ "x-custom": "myvalue" });
            });
            test("Should validate headers against a schema", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/headers",
                    method: ["GET"],
                    handler: async ({ req, json }) =>
                        json(req.headers(z.object({ "x-custom": z.string() }))),
                });

                const response = await router.fetch(
                    new Request("https://test.local/headers", {
                        headers: { "x-custom": "myvalue" },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ "x-custom": "myvalue" });
            });
            test("Should return a 400 status when header validation fails", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/headers",
                    method: ["GET"],
                    handler: async ({ req, text }) => {
                        req.headers(
                            z.object({ "x-custom": z.string().min(10) }),
                        );
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/headers", {
                        headers: { "x-custom": "myvalue" },
                    }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
        });
        describe("method: formData", () => {
            test("Should return form data fields", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/form",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const data = await req.formData();
                        return json({ name: data["name"] });
                    },
                });

                const formData = new URLSearchParams({ name: "John" });
                const response = await router.fetch(
                    new Request("https://test.local/form", {
                        method: "POST",
                        body: String(formData),
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ name: "John" });
            });
        });
        describe("method: fields", () => {
            test("Should validate form fields against a schema", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/fields",
                    method: ["POST"],
                    handler: async ({ req, json }) =>
                        json(await req.fields(z.object({ name: z.string() }))),
                });

                const formData = new URLSearchParams({ name: "John" });
                const response = await router.fetch(
                    new Request("https://test.local/fields", {
                        method: "POST",
                        body: String(formData),
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ name: "John" });
            });
            test("Should return a 400 status when field validation fails", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/fields",
                    method: ["POST"],
                    handler: async ({ req, text }) => {
                        await req.fields(
                            z.object({ name: z.string().min(10) }),
                        );
                        return text("ok");
                    },
                });

                const formData = new URLSearchParams({ name: "John" });
                const response = await router.fetch(
                    new Request("https://test.local/fields", {
                        method: "POST",
                        body: String(formData),
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
        });
        describe("method: files", () => {
            test("Should pass when the file content type matches", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({
                            avatar: { contentType: "image/png" },
                        });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 1 });
            });
            test("Should return a 400 status when the file content type does not match", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, text }) => {
                        await req.files({
                            avatar: { contentType: "application/pdf" },
                        });
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
            test("Should pass when the file size is within the limit", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({
                            avatar: { fileSize: FileSize.fromBytes(100) },
                        });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 1 });
            });
            test("Should return a 400 status when the file size exceeds the limit", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, text }) => {
                        await req.files({
                            avatar: { fileSize: FileSize.fromBytes(1) },
                        });
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
            test("Should pass when the file name matches the pattern", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({
                            avatar: { name: /\.png$/ },
                        });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile("photo.png") }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 1 });
            });
            test("Should return a 400 status when the file name does not match the pattern", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, text }) => {
                        await req.files({ avatar: { name: /\.jpg$/ } });
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile("photo.png") }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
            test("Should pass when the minimum number of files is met", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({ avatar: { min: 2 } });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({
                        avatar: [createFile("a.png"), createFile("b.png")],
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 2 });
            });
            test("Should return a 400 status when fewer files than the minimum are uploaded", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, text }) => {
                        await req.files({ avatar: { min: 2 } });
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
            test("Should pass when the maximum number of files is not exceeded", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({ avatar: { max: 1 } });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 1 });
            });
            test("Should return a 400 status when more files than the maximum are uploaded", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, text }) => {
                        await req.files({ avatar: { max: 1 } });
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    createFormRequest({
                        avatar: [createFile("a.png"), createFile("b.png")],
                    }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
            test("Should allow an optional file field to be absent", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({
                            avatar: { optional: true },
                        });
                        return json({ count: Object.keys(files).length });
                    },
                });

                const formData = new FormData();
                formData.set("description", "no files");
                const response = await router.fetch(
                    new Request("https://test.local/upload", {
                        method: "POST",
                        body: formData,
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ count: 0 });
            });
            test("Should pass when a required file is present", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({
                            avatar: { optional: false },
                        });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 1 });
            });
            test("Should pass when a dynamic definition returns null", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({ avatar: () => null });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 1 });
            });
            test("Should return a 400 status when a dynamic definition returns a message", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, text }) => {
                        await req.files({ avatar: () => "Invalid file" });
                        return text("ok");
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                expect(response.status).toBe(200);
                const body = await response.json();
                expect(body).toMatchObject({ status: "400" });
            });
            test("Should validate multiple fields with static and dynamic definitions", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({
                            avatar: { name: /\.png$/ },
                            docs: (collection) =>
                                collection.size() === 1
                                    ? null
                                    : "Expected one file",
                        });
                        return json({
                            avatar: files["avatar"].size(),
                            docs: files["docs"].size(),
                        });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({
                        avatar: createFile("avatar.png"),
                        docs: createFile("doc.pdf", "application/pdf"),
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ avatar: 1, docs: 1 });
            });
            test("Should pass through a field with an undefined definition", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/upload",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const files = await req.files({ avatar: undefined });
                        return json({ size: files["avatar"].size() });
                    },
                });

                const response = await router.fetch(
                    createFormRequest({ avatar: createFile() }),
                );
                const body = await response.json();
                expect(body).toEqual({ size: 1 });
            });
        });
        describe("method: text", () => {
            test("Should read the request body as text", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/text",
                    method: ["POST"],
                    handler: async ({ req, text }) => text(await req.text()),
                });

                const response = await router.fetch(
                    new Request("https://test.local/text", {
                        method: "POST",
                        body: "hello world",
                    }),
                );
                expect(await response.text()).toBe("hello world");
            });
        });
        describe("method: bytes", () => {
            test("Should read the request body as bytes", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/bytes",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const bytes = await req.bytes();
                        return json({
                            isUint8Array: bytes instanceof Uint8Array,
                            text: new TextDecoder().decode(bytes),
                        });
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/bytes", {
                        method: "POST",
                        body: "data",
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ isUint8Array: true, text: "data" });
            });
        });
        describe("method: arrayBuffer", () => {
            test("Should read the request body as an ArrayBuffer", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/array-buffer",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const buffer = await req.arrayBuffer();
                        return json({
                            isArrayBuffer: buffer instanceof ArrayBuffer,
                        });
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/array-buffer", {
                        method: "POST",
                        body: "data",
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ isArrayBuffer: true });
            });
        });
        describe("method: blob", () => {
            test("Should read the request body as a Blob", async () => {
                const router = new HttpRouter({ router: createHonoRouter() });
                router.endpoint({
                    url: "/blob",
                    method: ["POST"],
                    handler: async ({ req, json }) => {
                        const blob = await req.blob();
                        return json({
                            isBlob: blob instanceof Blob,
                            size: blob.size,
                        });
                    },
                });

                const response = await router.fetch(
                    new Request("https://test.local/blob", {
                        method: "POST",
                        body: "blob data",
                    }),
                );
                const body = await response.json();
                expect(body).toEqual({ isBlob: true, size: 9 });
            });
        });
    });
});

---
sidebar_position: 1
sidebar_label: Usage
pagination_label: HTTP Router usage
tags:
    - HTTP Router
    - Routing
    - Middleware
    - WinterTC
keywords:
    - HttpRouter
    - Routing
    - Middleware
    - HTTP
    - Winter TC
---

# HTTP Router usage

The `@daiso-tech/core/http-router` component provides a framework-agnostic HTTP router built on top of the [Hono](https://hono.dev/) router engine. It implements the **Winter TC fetch object standard**, which means it exposes a standard `fetch(request): Response` signature. This allows it to be integrated directly into any runtime or framework that supports the Fetch API — including Node.js, Bun, Deno, Cloudflare Workers, Next.js, Nuxt, SvelteKit, and more.

The router provides typed path parameters, a middleware chain with shared context, response helpers, cookie management, file upload validation, and schema-based request validation.

## Initial configuration

To begin using the `HttpRouter` class, you'll need to create and configure an instance:

```ts
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";

const router = new HttpRouter({
    router: new SmartRouter({
        routers: [new RegExpRouter(), new TrieRouter()],
    }),
});
```

The `router` setting accepts any Hono-compatible router instance. For most use cases, the pre-configured `SmartRouter` with `RegExpRouter` and `TrieRouter` provides the best balance of performance and feature support.

You can also use the bundled `defaultHttpRouterAdapter`:

```ts
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter,
});
```

:::info
Here is a complete list of settings for the [`HttpRouter`](https://daiso-tech.github.io/daiso-core/types/HttpRouter.HttpRouterSettings.html) class.
:::

## HttpRouter basics

### Defining endpoints

#### Basic endpoints

You can register an endpoint using the `endpoint` method with a URL pattern and handler:

```ts
import { HttpRouter } from "@daiso-tech/core/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter,
});

router.endpoint({
    url: "/hello",
    method: ["GET"],
    handler: async ({ text }) => {
        return text("Hello World");
    },
});
```

#### HTTP methods

You can specify one or more HTTP methods an endpoint responds to:

```ts
router.endpoint({
    url: "/resource",
    method: ["GET"],
    handler: async ({ text }) => text("GET /resource"),
});

router.endpoint({
    url: "/resource",
    method: ["POST"],
    handler: async ({ text }) => text("POST /resource"),
});

router.endpoint({
    url: "/resource",
    method: ["PUT"],
    handler: async ({ text }) => text("PUT /resource"),
});

router.endpoint({
    url: "/resource",
    method: ["DELETE"],
    handler: async ({ text }) => text("DELETE /resource"),
});
```

When no `method` is specified, the endpoint responds to **all** HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, CONNECT, TRACE).

You can also use custom HTTP methods like `PURGE`:

```ts
router.endpoint({
    url: "/cache",
    method: ["PURGE"],
    handler: async ({ text }) => text("PURGE Method /cache"),
});
```

#### Multiple methods

You can register the same handler for multiple methods at once:

```ts
router.endpoint({
    url: "/post",
    method: ["PUT", "DELETE"],
    handler: async ({ req, text }) => {
        return text(`${req.method} /post`);
    },
});
```

#### Path parameters

Define dynamic path segments with `:paramName` syntax. The router automatically extracts path parameters and makes them available via `req.rawParams()`:

```ts
router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const params = req.rawParams();
        return json({ userId: params.id });
    },
});
```

Multiple path parameters are also supported:

```ts
router.endpoint({
    url: "/posts/:id/comment/:commentId",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const { id, commentId } = req.rawParams();
        return json({ postId: id, commentId });
    },
});
```

#### Optional parameters

Parameters can be made optional with the `?` suffix. The route matches both with and without the parameter:

```ts
// Will match `/api/animal` and `/api/animal/:type`
router.endpoint({
    url: "/api/animal/:type?",
    method: ["GET"],
    handler: async ({ text }) => text("Animal!"),
});
```

#### Wildcard patterns

Use `*` as a wildcard segment to match any value:

```ts
// Matches /wild/anything/card
router.endpoint({
    url: "/wild/*/card",
    method: ["GET"],
    handler: async ({ text }) => text("GET /wild/*/card"),
});
```

Deep wildcards match across multiple path segments:

```ts
// Matches /static/js/app.js, /static/css/style.css, etc.
router.endpoint({
    url: "/static/*",
    method: ["GET"],
    handler: async ({ text }) => text("Static file"),
});
```

#### Regex-constrained parameters

You can constrain path parameters with regular expressions:

```ts
router.endpoint({
    url: "/post/:date{[0-9]+}/:title{[a-z]+}",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const { date, title } = req.rawParams();
        return json({ date, title });
    },
});
```

You can also use regexp patterns that include slashes:

```ts
router.endpoint({
    url: "/posts/:filename{.+\\.png}",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const { filename } = req.rawParams();
        return json({ filename });
    },
});
```

#### Method matching behaviour

If a request arrives for a path that exists but with a method that is not registered, the router returns a `404 Not Found` response:

```ts
router.endpoint({
    url: "/get-only",
    method: ["GET"],
    handler: async ({ text }) => text("Only GET"),
});

// POST /get-only → 404 Not Found
// GET /get-only  → 200 "Only GET"
```

### Route grouping

You can group routes under a common prefix using the `group` method:

```ts
router.group("/api", (api) => {
    api.endpoint({
        url: "/users",
        method: ["GET"],
        handler: async ({ json }) => json({ users: [] }),
    });

    api.endpoint({
        url: "/users/:id",
        method: ["GET"],
        handler: async ({ req, json }) => {
            const { id } = req.rawParams();
            return json({ userId: id });
        },
    });
});
```

Routes defined inside the group are automatically prefixed. For example, `/users` becomes `/api/users`.

Groups can also be nested without a prefix:

```ts
router.group((sub) => {
    sub.endpoint({
        url: "/nested",
        method: ["GET"],
        handler: async ({ text }) => text("Nested route"),
    });
});
```

### Handler arguments

Route handlers receive an object with the following properties:

#### `req` — The incoming request

The `req` object provides access to all request data:

```ts
router.endpoint({
    url: "/data",
    method: ["POST"],
    handler: async ({ req }) => {
        // JSON body
        const json = await req.rawJson();

        // Form data (fields and files)
        const formData = await req.rawFormData();

        // Path parameters
        const params = req.rawParams();

        // Query string parameters
        const searchParams = req.rawSearchParams();

        // Headers
        const headers = req.rawHeaders();

        // Cookies
        const cookies = req.rawCookies();

        // Raw body as text
        const text = await req.text();

        // Raw body as bytes
        const bytes = await req.bytes();

        // Underlying Web API Request
        const webReq = req.webReq;

        // AbortSignal for cancellation
        const signal = req.signal;

        // You can read the req as an AsyncIterable stream
        for await (const chunk of req) {
            console.log("CHUNK:", chunk);
        }
    },
});
```

#### Request validation with schemas

You can apply [Standard Schema](https://standardschema.dev/) validation to any request data source using the `withSchema` method:

```ts
import { z } from "zod";

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const validated = req.withSchema({
            params: z.object({ id: z.string() }),
            searchParams: z.object({
                include: z.string().optional(),
            }),
        });

        const { id } = validated.params();
        const { include } = validated.searchParams();

        return json({ userId: id, include });
    },
});
```

#### `res` — The response builder

The `res` object allows building the response using a fluent API:

```ts
router.endpoint({
    url: "/response",
    method: ["GET"],
    handler: async ({ res }) => {
        return res
            .setStatus(201)
            .setHeader("X-Custom", "value")
            .setBody("Created");
    },
});
```

#### `context`

The `context` object is a shared key-value store that lives for the duration of a single request. It persists across the middleware chain and the final handler, making it ideal for passing data between middleware and handlers:

```ts
import { contextToken } from "@daiso-tech/core/execution-context";

type IUser = {
    id: string;
    firstName: string;
    lastName: string;
};

async function loadUser(): Promise<IUser> {
    // ...
}

const token = contextToken<IUser>("USER");

router.use(async ({ context, next }) => {
    context.put(token, await loadUser());
    return await next();
});

router.endpoint({
    url: "/profile",
    method: ["GET"],
    handler: async ({ context, json }) => {
        const user = context.getOrFail(token);
        return json(user);
    },
});
```

### Response helpers

Handler arguments include response helper methods for creating common responses. These are destructured directly from the handler args:

#### text

```ts
handler: async ({ text }) => text("Hello World");
// Content-Type: text/plain
```

#### html

```ts
handler: async ({ html }) => html("<h1>Title</h1>");
// Content-Type: text/html
```

#### json

```ts
handler: async ({ json }) => json({ message: "success" });
// Content-Type: application/json
```

The `json` helper also accepts an optional Standard Schema for runtime validation:

```ts
import { z } from "zod";

handler: async ({ json }) =>
    json({ name: "John" }, z.object({ name: z.string() }));
```

#### notFound

```ts
handler: async ({ notFound }) => notFound();
// Status: 404, Content-Type: text/html
```

#### redirect

```ts
handler: async ({ redirect }) => redirect("/new-location");
// Status: 302, Location: /new-location
```

#### permanentRedirect

```ts
handler: async ({ permanentRedirect }) => permanentRedirect("/new-permanent");
// Status: 301, Location: /new-permanent
```

### Cookie management

The response builder provides full cookie management through the fluent API.

#### Setting cookies

```ts
handler: async ({ res }) => {
    return res
        .putCookie("session", "abc123", {
            httpOnly: true,
            secure: true,
            maxAge: TimeSpan.fromHours(1),
            path: "/",
            sameSite: "Lax",
        })
        .setBody("Cookie set");
};
```

Cookie settings include:

- `expires` — Absolute `Date` or relative `ITimeSpan`
- `maxAge` — Lifetime in seconds (number or `ITimeSpan`)
- `httpOnly` — Restrict access to HTTP-only
- `secure` — Only send over HTTPS
- `sameSite` — `"Strict"`, `"Lax"` (default), or `"None"`
- `domain` — The domain scope
- `path` — The path scope
- `priority` — `"Low"`, `"Medium"`, or `"High"`
- `prefix` — `"secure"` (adds `__Secure-`) or `"host"` (adds `__Host-`)
- `partitioned` — Enable CHIPS partitioned storage

#### Removing cookies

```ts
handler: async ({ res }) => {
    return res.removeCookie("session").setBody("Cookie removed");
};
```

#### Checking if response has set a cookie

```ts
handler: async ({ res }) => {
    if (res.hasCookies("session")) {
        res.removeCookie("session");
    }
    return res.setBody("Checked");
};
```

#### Stripping cookies from response

You can remove all cookies or a specific cookie from the response:

```ts
handler: async ({ res }) => {
    return res.withoutCookies().setBody("All cookies stripped");
};
```

### Middleware

#### Shared middleware

Use the `use` method to register middleware that applies to **multiple routes** registered on the same router instance:

```ts
router.use(async ({ req, next }) => {
    const start = Date.now();
    const response = await next();
    const duration = Date.now() - start;
    response.setHeader("X-Response-Time", String(duration));
    return response;
});

router.endpoint({
    url: "/api/data",
    method: ["GET"],
    handler: async ({ json }) => json({ data: "test" }),
});
```

#### Endpoint-specific middleware

Use the `middlewares` property on an endpoint definition to register middleware that runs **only for that specific endpoint**. This keeps middleware scoped and prevents it from affecting other routes:

```ts
router.endpoint({
    url: "/admin",
    method: ["GET"],
    handler: async ({ text }) => text("Admin panel"),
    middlewares: (builder) =>
        builder.use(async ({ req, next }) => {
            const authHeader = req.rawHeaders()["authorization"];
            if (!authHeader) {
                return new HttpRes().setStatus(401).setBody("Unauthorized");
            }
            return await next();
        }),
});
```

#### Middleware execution order

Middleware executes in the following order:

1. **Shared middlewares** (from `router.use()`) — registered in order
2. **Endpoint-specific middlewares** (from `endpoint.middlewares`) — registered in order
3. **Handler** — innermost

Each middleware receives a `next` function. Calling `await next()` passes control to the next middleware in the chain. A middleware can short-circuit the chain by returning a response without calling `next()`.

## Patterns

### File handling

Form data with file uploads is handled through the `rawFormData()` method, which returns file entries as `IHttpFile` instances:

```ts
router.endpoint({
    url: "/upload",
    method: ["POST"],
    handler: async ({ req }) => {
        const formData = await req.rawFormData();
        const file = formData["avatar"];

        if (file && typeof file !== "string") {
            const content = await file.asText();
            const name = file.name;
            const type = file.contentType;
            const size = file.fileSize;
            // Process the file...
        }
    },
});
```

#### File access methods

| Method               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `asText()`           | Reads the file content as a UTF-8 string             |
| `asBytes()`          | Reads the file content as `Uint8Array`               |
| `asArrayBuffer()`    | Reads the file content as `ArrayBuffer`              |
| `asReadableStream()` | Returns a `ReadableStream<Uint8Array>` for streaming |
| `asFile()`           | Returns the underlying Web API `File` object         |

#### File properties

| Property       | Type       | Description                                       |
| -------------- | ---------- | ------------------------------------------------- |
| `name`         | `string`   | The original file name                            |
| `contentType`  | `string`   | The MIME type                                     |
| `lastModified` | `Date`     | The last modified timestamp                       |
| `fileSize`     | `FileSize` | The file size (from `@daiso-tech/core/file-size`) |

### Error handling

Errors thrown inside handlers or middleware propagate as a generic `500 Internal Server Error` response. To return structured HTTP errors with proper status codes and messages, use the `HttpError` class:

```ts
import { HttpError } from "@daiso-tech/core/http-router/contracts";

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
```

### Testing

You can test the code by creating a standard web `Request` object and passing it to the `fetch` method of the `HttpRouter` class:

```ts
import { HttpReq } from "@daiso-tech/core/http-router";
import { describe, expect, test } from "vitest";

describe("My router", () => {
    test("should respond to GET /hello", async () => {
        const router = new HttpRouter({
            router: defaultHttpRouterAdapter,
        });

        router.endpoint({
            url: "/hello",
            method: ["GET"],
            handler: async ({ text }) => text("Hello World"),
        });

        const request = new Request("https://test.local/hello");
        const response = await router.fetch(request);
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("Hello World");
    });
});
```

You can also use `HttpReq.test()` to easily create a standard web `Request`:

```ts
import { HttpReq } from "@daiso-tech/core/http-router";

const httpReq = HttpReq.test({
    method: "POST",
    url: "/api/data",
    params: { id: "42" },
    searchParams: { include: "profile" },
    headers: { authorization: "Bearer token" },
    cookies: { session: "abc123" },
    body: {
        type: "application/json",
        data: { name: "John" },
    },
});
```

#### `TestReqJsonBody`

Simulates an `application/json` payload:

```ts
import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "@daiso-tech/core/http-router";
import { describe, expect, test } from "vitest";

describe("JSON body", () => {
    test("should send JSON data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/users/:id",
            method: ["POST"],
            handler: async ({ req, json }) =>
                json({
                    params: req.rawParams(),
                    body: await req.rawJson(),
                }),
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/users/:id",
            hostname: "https://api.example.com",
            params: { id: "42" },
            searchParams: { include: "profile", tags: ["a", "b"] },
            headers: { authorization: "Bearer token" },
            cookies: { session: "abc123" },
            body: {
                type: "application/json",
                data: { name: "John" },
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
```

#### `TestReqUrlEncodedBody`

Simulates an `application/x-www-form-urlencoded` form:

```ts
import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "@daiso-tech/core/http-router";
import { describe, expect, test } from "vitest";

describe("URL-encoded body", () => {
    test("should send form data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/submit",
            method: ["POST"],
            handler: async ({ req, text }) =>
                text(String(await req.rawFormData())),
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/submit",
            body: {
                type: "application/x-www-form-urlencoded",
                data: { username: "john", role: "admin" },
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
```

#### `TestReqMultipartFormDataBody`

Simulates a `multipart/form-data` payload with optional text fields and file uploads:

```ts
import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "@daiso-tech/core/http-router";
import { describe, expect, test } from "vitest";

describe("Multipart body", () => {
    test("should send multipart form with file uploads", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/upload",
            method: ["POST"],
            handler: async ({ req, json }) => {
                const formData = await req.rawFormData();
                const file = formData["avatar"];
                const content =
                    file && typeof file !== "string"
                        ? await file.asText()
                        : null;
                return json({ uploaded: !!content });
            },
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/upload",
            body: {
                type: "multipart/form-data",
                data: {
                    fields: { description: "my file" },
                    files: {
                        avatar: new TextEncoder().encode("file content").buffer,
                    },
                },
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
```

#### `TestReqCustom`

Passes `data` through as-is for arbitrary payloads:

```ts
import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "@daiso-tech/core/http-router";
import { describe, expect, test } from "vitest";

describe("Custom body", () => {
    test("should send raw data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/raw",
            method: ["POST"],
            handler: async ({ req, text }) => text(await req.text()),
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/raw",
            body: {
                type: "custom",
                data: new Blob(["raw data"]),
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
```

### Runtime type safety for request data

You can enforce runtime and compile-time type safety by passing [Standard Schema](https://standardschema.dev/) to `withSchema`:

```ts
import { z } from "zod";

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const validated = req.withSchema({
            params: z.object({ id: z.string() }),
            searchParams: z.object({
                include: z.string().optional(),
            }),
        });

        // Fully typed — TypeScript infers the correct types
        const { id } = validated.params();
        const { include } = validated.searchParams();

        return json({ userId: id, include });
    },
});
```

#### File upload validation with schemas

You can define file validation rules on the schemas passed to `withSchema`. Each file field accepts a `FileDef` that can constrain content type, file size, filename, and cardinality:

```ts
import { FileSize } from "@daiso-tech/core/file-size";

router.endpoint({
    url: "/upload-avatar",
    method: ["POST"],
    handler: async ({ req }) => {
        const validated = req.withSchema({
            files: {
                avatar: {
                    contentType: "image/png",
                    fileSize: FileSize.fromMegaBytes(5),
                    name: /\.png$/,
                    max: 1,
                    optional: false,
                },
            },
        });

        const avatarFiles = await validated.files("avatar");
        const file = avatarFiles.firstOrFail();
        const content = await file.asBytes();
        // Process the avatar...
    },
});
```

:::info
All validation throw a `ValidationError` if constraints are not met.
:::

### Using the context for request-scoped data

The shared `context` object is useful for passing data between middleware and handlers:

```ts
const REQ_ID = contextToken<string>("REQ_ID");
const CURRENT_DATE = contextToken<string>("CURRENT_DATE");

router.use(async ({ context, next }) => {
    context.put(REQ_ID, crypto.randomUUID());
    context.put(CURRENT_DATE, Date.now());
    return await next();
});

router.endpoint({
    url: "/track",
    method: ["GET"],
    handler: async ({ context, text }) => {
        const requestId = context.getOrFail(REQ_ID);
        const startTime = context.getOrFail(CURRENT_DATE);
        return text(`Request ${String(requestId)} processed`);
    },
});
```

### Using invokable objects as handlers and middleware

Both handlers and middleware can be invokable objects (classes with an `invoke` method), which allows them to encapsulate state. This pattern is designed for seamless integration with dependency injection libraries, as most DI frameworks have first-class support for classes.

**Handler example** using `IHttpHandlerObject`:

```ts
import {
    type IHttpHandlerObject,
    type HttpHandlerArgs,
} from "@daiso-tech/core/http-router/contracts";

class GreetingHandler implements IHttpHandlerObject {
    constructor(private readonly greeting: string) {}

    invoke(args: HttpHandlerArgs): IHttpRes {
        const { text } = args;
        return text(this.greeting);
    }
}

router.endpoint({
    url: "/greet",
    method: ["GET"],
    handler: new GreetingHandler("Hello from a class handler!"),
});
```

**Middleware example** using `IHttpMiddlewareObject`:

```ts
import {
    type IHttpMiddlewareObject,
    type HttpMiddlewareArgs,
    type IHttpRes,
} from "@daiso-tech/core/http-router/contracts";

class AuthMiddleware implements IHttpMiddlewareObject {
    constructor(private readonly apiKey: string) {}

    async invoke(args: HttpMiddlewareArgs): Promise<IHttpRes> {
        const { req, next } = args;
        const authHeader = req.rawHeaders()["authorization"];
        if (authHeader !== `Bearer ${this.apiKey}`) {
            return new HttpRes().setStatus(401).setBody("Unauthorized");
        }
        return await next();
    }
}

router.use(new AuthMiddleware("sk-1234"));
```

:::info
For further information about invokable objects, refer to the [`Invokable`](../../utilities/invokable.md) documentation.
:::

### Interoperability with Winter TC standard web request handlers

A Winter TC handler is a function with the signature `(request: Request) => Promise<Response> | Response`. Since `HttpRouter` endpoints expect the richer `HttpHandlerArgs` interface, you can use the `HttpRouter.fromWinterTcHandler()` static method to bridge the two seamlessly:

```ts
import { HttpRouter } from "@daiso-tech/core/http-router";
import { type WinterTcRequestHandler } from "@daiso-tech/core/http-router/contracts";

// A standard Winter TC handler
const healthHandler: WinterTcRequestHandler = async (request) => {
    if (request.method.toLowerCase() !== "get") {
        return new Response("Not found", { status: 404 });
    }
    const url = new URL(request.url);
    if (url.pathname === "/health") {
        return new Response("OK", { status: 200 });
    }
    return fetch(request);
};

// Adapted to work with HttpRouter endpoint via the static method
router.endpoint({
    url: "/proxy/*",
    handler: HttpRouter.fromWinterTcHandler(healthHandler),
});
```

The method internally passes `req.webReq` (the underlying Web API `Request`) to the Winter TC handler and converts the returned `Response` into an `IHttpRes` via `fromWebRes()`.

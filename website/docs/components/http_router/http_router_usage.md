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

The `eridu-tech/http-router` component provides a framework-agnostic HTTP router built on top of the [Hono](https://hono.dev/) router engine. It implements the **Winter TC fetch object standard**, which means it exposes a standard `fetch(request): Response` signature. This allows it to be integrated directly into any runtime or framework that supports the Fetch API including Node.js, Bun, Deno, Cloudflare Workers, Next.js, Nuxt, SvelteKit, and more.

The router provides typed path parameters, a middleware chain with shared context, response helpers, cookie management, file upload validation, and schema-based request validation.

## Initial configuration

To begin using the `HttpRouter` class, you'll need to create and configure an instance:

```ts
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
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
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter,
});
```

:::info
Here is a complete list of settings for the [`HttpRouter`](https://eridu-tech.github.io/eridu-tech-core/types/HttpRouter.HttpRouterSettings.html) class.
:::

## HttpRouter basics

### Defining endpoints

#### Basic endpoints

You can register an endpoint using the `endpoint` method with a URL pattern and handler:

```ts
import { HttpRouter } from "eridu-tech/http-router";

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

Define dynamic path segments with `:paramName` syntax. The router automatically extracts path parameters and makes them available via `req.params()`:

```ts
router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const params = req.params();
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
        const { id, commentId } = req.params();
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
        const { date, title } = req.params();
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
        const { filename } = req.params();
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
            const { id } = req.params();
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

#### `req` The incoming request

The `req` object provides access to all request data:

```ts
router.endpoint({
    url: "/data",
    method: ["POST"],
    handler: async ({ req }) => {
        // JSON body
        const json = await req.json();

        // Form fields (text only)
        const fields = await req.fields();

        // Uploaded files
        const files = await req.files();

        // Raw form data (fields and files)
        const formData = await req.formData();

        // Path parameters
        const params = req.params();

        // Query string parameters
        const searchParams = req.searchParams();

        // Headers
        const headers = req.headers();

        // Cookies
        const cookies = req.cookies();

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

#### `res` The response builder

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
import { contextToken } from "eridu-tech/execution-context";

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

const responseSchema = z.object({ name: z.string() });

handler: async ({ json }) => json({ name: "John" }, responseSchema);
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

- `expires` Absolute `Date` or relative `ITimeSpan`
- `maxAge` Lifetime in seconds (number or `ITimeSpan`)
- `httpOnly` Restrict access to HTTP-only
- `secure` Only send over HTTPS
- `sameSite` `"Strict"`, `"Lax"` (default), or `"None"`
- `domain` The domain scope
- `path` The path scope
- `priority` `"Low"`, `"Medium"`, or `"High"`
- `prefix` `"secure"` (adds `__Secure-`) or `"host"` (adds `__Host-`)
- `partitioned` Enable CHIPS partitioned storage

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
        builder.use(async ({ req, res, next }) => {
            const authHeader = req.headers()["authorization"];
            if (!authHeader) {
                return res.setStatus(401).setBody("Unauthorized");
            }
            return await next();
        }),
});
```

#### Middleware execution order

Middleware executes in the following order:

1. **Shared middlewares** (from `router.use()`) registered in order
2. **Endpoint-specific middlewares** (from `endpoint.middlewares`) registered in order
3. **Handler** innermost

Each middleware receives a `next` function. Calling `await next()` passes control to the next middleware in the chain. A middleware can short-circuit the chain by returning a response without calling `next()`.

## Patterns

### Handling file uploads

Uploaded files are accessed through the `files()` method, which returns a record mapping each file field name to an `IHttpFileCollection`:

```ts
router.endpoint({
    url: "/upload",
    method: ["POST"],
    handler: async ({ req, json }) => {
        const files = await req.files();

        // Single file: get the first file, or a 400 if none was uploaded.
        const avatar = files["avatar"].firstOrFail();

        // Multiple files: iterate the collection directly.
        for (const document of files["documents"]) {
            console.log(document.name);
        }

        // Inspect the file...
        const content = await avatar.asText();
        const name = avatar.name;
        const type = avatar.contentType;
        const size = avatar.fileSize;

        return json({
            name,
            type,
            sizeInBytes: size.toBytes(),
            content,
        });
    },
});
```

An `IHttpFileCollection` handles zero, one, or many files with the same API:

| Method             | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `size()`           | Returns the number of files in the collection                   |
| `get(index)`       | Returns the file at a 0-based index, or `null` if out of bounds |
| `getOrFail(index)` | Returns the file at a 0-based index, throws a 400 if missing    |
| `first()`          | Returns the first file, or `null` if the collection is empty    |
| `firstOrFail()`    | Returns the first file, throws a 400 if the collection is empty |
| `isEmpty()`        | Returns whether the collection has no files                     |

#### File access methods

| Method               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `asText()`           | Reads the file content as a UTF-8 string             |
| `asBytes()`          | Reads the file content as `Uint8Array`               |
| `asArrayBuffer()`    | Reads the file content as `ArrayBuffer`              |
| `asReadableStream()` | Returns a `ReadableStream<Uint8Array>` for streaming |
| `asFile()`           | Returns the underlying Web API `File` object         |

#### File properties

| Property       | Type       | Description                                 |
| -------------- | ---------- | ------------------------------------------- |
| `name`         | `string`   | The original file name                      |
| `contentType`  | `string`   | The MIME type                               |
| `lastModified` | `Date`     | The last modified timestamp                 |
| `fileSize`     | `FileSize` | The file size (from `eridu-tech/file-size`) |

### Validating request data

You can enforce runtime and compile-time type safety by passing [Standard Schema](https://standardschema.dev/) schemas directly to the request methods.

#### Validating cookies, params, and headers

The `cookies()`, `params()`, and `headers()` methods return a record of string values and accept a schema synchronously:

```ts
import { z } from "zod";

const cookiesSchema = z.object({ session: z.string().optional() });
const paramsSchema = z.object({ id: z.string() });
const headersSchema = z.object({ authorization: z.string() });

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const cookies = req.cookies(cookiesSchema);
        const params = req.params(paramsSchema);
        const headers = req.headers(headersSchema);

        return json({
            userId: params.id,
            session: cookies.session,
            auth: headers.authorization,
        });
    },
});
```

#### Validating search params and fields

The `searchParams()` and `fields()` methods return a record where each value can be a single string or an array of strings, and accept a schema for validation:

```ts
import { z } from "zod";

const searchParamsSchema = z.object({
    include: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const fieldsSchema = z.object({
    name: z.string(),
    age: z.coerce.number(),
});

router.endpoint({
    url: "/signup",
    method: ["POST"],
    handler: async ({ req, json }) => {
        const searchParams = req.searchParams(searchParamsSchema);
        const fields = await req.fields(fieldsSchema);

        return json({
            include: searchParams.include,
            tags: searchParams.tags,
            name: fields.name,
            age: fields.age,
        });
    },
});
```

#### Validating the JSON body

The `json()` method parses the request body and validates it asynchronously:

```ts
import { z } from "zod";

const jsonSchema = z.object({
    name: z.string(),
    age: z.number(),
});

router.endpoint({
    url: "/users",
    method: ["POST"],
    handler: async ({ req, json }) => {
        const body = await req.json(jsonSchema);

        return json({ name: body.name, age: body.age });
    },
});
```

#### Validating uploaded files

You can define file validation rules by passing a record of file definitions directly to `req.files()`. Each file field accepts a `FileDef`, which is the union of a `StaticFileDef` (rules known ahead of time) and a `DynamicFileDef` (a function that inspects the uploaded files at runtime):

```ts
import { FileSize } from "eridu-tech/file-size";
import { type FileInputs } from "eridu-tech/http-router/contracts";

const fileInputs = {
    // Static validation rules known ahead of time.
    avatar: {
        contentType: "image/png",
        fileSize: FileSize.fromMegaBytes(5),
        name: /\.png$/,
        max: 1,
        optional: false,
    },
    // Dynamic validation rules not known ahead of time.
    // returns an error message string, or `null` when the files pass.
    docs: (collection) => (collection.size() > 2 ? "Too many documents" : null),
} satisfies FileInputs;

router.endpoint({
    url: "/upload-avatar",
    method: ["POST"],
    handler: async ({ req }) => {
        const files = await req.files(fileInputs);

        const avatarFiles = files.avatar;
        const file = avatarFiles.firstOrFail();
        const content = await file.asBytes();
        // Process the avatar...
    },
});
```

:::info
All validation throw an `HttpError` with status code `400` if constraints are not met.
:::

### Error handling

Errors thrown inside handlers or middleware propagate as a generic `500 Internal Server Error` response. To return structured HTTP errors with proper status codes and messages, use the `HttpError` class:

```ts
import { HttpError } from "eridu-tech/http-router/contracts";

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
import { HttpReq } from "eridu-tech/http-router";
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
import { HttpReq } from "eridu-tech/http-router";

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
} from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("JSON body", () => {
    test("should send JSON data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/users/:id",
            method: ["POST"],
            handler: async ({ req, json }) =>
                json({
                    params: req.params(),
                    body: await req.json(),
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
} from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("URL-encoded body", () => {
    test("should send form data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/submit",
            method: ["POST"],
            handler: async ({ req, text }) =>
                text(String(await req.formData())),
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
} from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("Multipart body", () => {
    test("should send multipart form with file uploads", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/upload",
            method: ["POST"],
            handler: async ({ req, json }) => {
                const formData = await req.formData();
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
} from "eridu-tech/http-router";
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

### Using invocable objects as handlers and middleware

Both handlers and middleware can be invocable objects (classes with an `invoke` method), which allows them to encapsulate state. This pattern is designed for seamless integration with dependency injection libraries, as most DI frameworks have first-class support for classes.

**Handler example** using `IHttpHandlerObject`:

```ts
import {
    type IHttpHandlerObject,
    type HttpHandlerArgs,
} from "eridu-tech/http-router/contracts";

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
} from "eridu-tech/http-router/contracts";

class AuthMiddleware implements IHttpMiddlewareObject {
    constructor(private readonly apiKey: string) {}

    async invoke(args: HttpMiddlewareArgs): Promise<IHttpRes> {
        const { req, res, next } = args;
        const authHeader = req.headers()["authorization"];
        if (authHeader !== `Bearer ${this.apiKey}`) {
            return res.setStatus(401).setBody("Unauthorized");
        }
        return await next();
    }
}

router.use(new AuthMiddleware("sk-1234"));
```

:::info
For further information about invocable objects, refer to the [`Invocable`](../../utilities/invocable.md) documentation.
:::

### Interoperability with Winter TC standard web request handlers

A Winter TC handler is a function with the signature `(request: Request) => Promise<Response> | Response`. Since `HttpRouter` endpoints expect the richer `HttpHandlerArgs` interface, you can use the `HttpRouter.fromWinterTcHandler()` static method to bridge the two seamlessly:

```ts
import { HttpRouter } from "eridu-tech/http-router";

// A standard Winter TC handler
async function healthHandler(request: Request): Promise<Response> {
    if (request.method.toLowerCase() !== "get") {
        return new Response("Not found", { status: 404 });
    }
    const url = new URL(request.url);
    if (url.pathname === "/proxy/health") {
        return new Response("OK", { status: 200 });
    }
    return fetch(request);
}

// Adapted to work with HttpRouter endpoint via the static method
router.endpoint({
    url: "/proxy/*",
    handler: HttpRouter.fromWinterTcHandler(healthHandler),
});
```

The method internally passes `req.webReq` (the underlying Web API `Request`) to the Winter TC handler and converts the returned `Response` into an `IHttpRes` via `fromWebRes()`.

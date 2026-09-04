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

```ts file=./http_router_usage-samples/initial_configuration.ts
```

The `router` setting accepts any Hono-compatible router instance. For most use cases, the pre-configured `SmartRouter` with `RegExpRouter` and `TrieRouter` provides the best balance of performance and feature support.

You can also use the bundled `defaultHttpRouterAdapter`:

```ts file=./http_router_usage-samples/initial_configuration_default_adapter.ts
```

:::info
Here is a complete list of settings for the [`HttpRouter`](https://eridu-tech.github.io/eridu-tech-core/types/HttpRouter.HttpRouterSettings.html) class.
:::

## HttpRouter basics

### Defining endpoints

#### Basic endpoints

You can register an endpoint using the `endpoint` method with a URL pattern and handler:

```ts file=./http_router_usage-samples/basic_endpoint.ts
```

#### HTTP methods

You can specify one or more HTTP methods an endpoint responds to:

```ts file=./http_router_usage-samples/http_methods.ts
```

When no `method` is specified, the endpoint responds to **all** HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, CONNECT, TRACE).

You can also use custom HTTP methods like `PURGE`:

```ts file=./http_router_usage-samples/custom_http_method.ts
```

#### Multiple methods

You can register the same handler for multiple methods at once:

```ts file=./http_router_usage-samples/multiple_methods.ts
```

#### Path parameters

Define dynamic path segments with `:paramName` syntax. The router automatically extracts path parameters and makes them available via `req.params()`:

```ts file=./http_router_usage-samples/path_parameters.ts
```

Multiple path parameters are also supported:

```ts file=./http_router_usage-samples/multiple_path_parameters.ts
```

#### Optional parameters

Parameters can be made optional with the `?` suffix. The route matches both with and without the parameter:

```ts file=./http_router_usage-samples/optional_parameters.ts
```

#### Wildcard patterns

Use `*` as a wildcard segment to match any value:

```ts file=./http_router_usage-samples/wildcard_pattern.ts
```

Deep wildcards match across multiple path segments:

```ts file=./http_router_usage-samples/deep_wildcard.ts
```

#### Regex-constrained parameters

You can constrain path parameters with regular expressions:

```ts file=./http_router_usage-samples/regex_constrained_parameters.ts
```

You can also use regexp patterns that include slashes:

```ts file=./http_router_usage-samples/regex_parameters_with_slashes.ts
```

#### Method matching behaviour

If a request arrives for a path that exists but with a method that is not registered, the router returns a `404 Not Found` response:

```ts file=./http_router_usage-samples/method_matching_behaviour.ts
```

### Route grouping

You can group routes under a common prefix using the `group` method:

```ts file=./http_router_usage-samples/route_grouping.ts
```

Routes defined inside the group are automatically prefixed. For example, `/users` becomes `/api/users`.

Groups can also be nested without a prefix:

```ts file=./http_router_usage-samples/nested_group.ts
```

### Handler arguments

Route handlers receive an object with the following properties:

#### `req` The incoming request

The `req` object provides access to all request data:

```ts file=./http_router_usage-samples/handler_req_access.ts
```

#### `res` The response builder

The `res` object allows building the response using a fluent API:

```ts file=./http_router_usage-samples/handler_res_builder.ts
```

#### `context`

The `context` object is a shared key-value store that lives for the duration of a single request. It persists across the middleware chain and the final handler, making it ideal for passing data between middleware and handlers:

```ts file=./http_router_usage-samples/handler_context.ts
```

### Response helpers

Handler arguments include response helper methods for creating common responses. These are destructured directly from the handler args:

#### text

```ts file=./http_router_usage-samples/helper_text.ts
```

#### html

```ts file=./http_router_usage-samples/helper_html.ts
```

#### json

```ts file=./http_router_usage-samples/helper_json.ts
```

The `json` helper also accepts an optional Standard Schema for runtime validation:

```ts file=./http_router_usage-samples/helper_json_with_schema.ts
```

#### notFound

```ts file=./http_router_usage-samples/helper_not_found.ts
```

#### redirect

```ts file=./http_router_usage-samples/helper_redirect.ts
```

#### permanentRedirect

```ts file=./http_router_usage-samples/helper_permanent_redirect.ts
```

### Cookie management

The response builder provides full cookie management through the fluent API.

#### Setting cookies

```ts file=./http_router_usage-samples/cookie_set.ts
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

```ts file=./http_router_usage-samples/cookie_remove.ts
```

#### Checking if response has set a cookie

```ts file=./http_router_usage-samples/cookie_has.ts
```

#### Stripping cookies from response

You can remove all cookies or a specific cookie from the response:

```ts file=./http_router_usage-samples/cookie_strip.ts
```

### Middleware

#### Shared middleware

Use the `use` method to register middleware that applies to **multiple routes** registered on the same router instance:

```ts file=./http_router_usage-samples/shared_middleware.ts
```

#### Endpoint-specific middleware

Use the `middlewares` property on an endpoint definition to register middleware that runs **only for that specific endpoint**. This keeps middleware scoped and prevents it from affecting other routes:

```ts file=./http_router_usage-samples/endpoint_middleware.ts
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

```ts file=./http_router_usage-samples/file_upload.ts
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

```ts file=./http_router_usage-samples/validate_cookies_params_headers.ts
```

#### Validating search params and fields

The `searchParams()` and `fields()` methods return a record where each value can be a single string or an array of strings, and accept a schema for validation:

```ts file=./http_router_usage-samples/validate_search_params_fields.ts
```

#### Validating the JSON body

The `json()` method parses the request body and validates it asynchronously:

```ts file=./http_router_usage-samples/validate_json_body.ts
```

#### Validating uploaded files

You can define file validation rules by passing a record of file definitions directly to `req.files()`. Each file field accepts a `FileDef`, which is the union of a `StaticFileDef` (rules known ahead of time) and a `DynamicFileDef` (a function that inspects the uploaded files at runtime):

```ts file=./http_router_usage-samples/validate_uploaded_files.ts
```

:::info
All validation throw an `HttpError` with status code `400` if constraints are not met.
:::

### Error handling

Errors thrown inside handlers or middleware propagate as a generic `500 Internal Server Error` response. To return structured HTTP errors with proper status codes and messages, use the `HttpError` class:

```ts file=./http_router_usage-samples/http_error_handling.ts
```

### Testing

You can test the code by creating a standard web `Request` object and passing it to the `fetch` method of the `HttpRouter` class:

```ts file=./http_router_usage-samples/testing_basic.ts
```

You can also use `HttpReq.test()` to easily create a standard web `Request`:

```ts file=./http_router_usage-samples/testing_http_req_test.ts
```

#### `TestReqJsonBody`

Simulates an `application/json` payload:

```ts file=./http_router_usage-samples/testing_json_body.ts
```

#### `TestReqUrlEncodedBody`

Simulates an `application/x-www-form-urlencoded` form:

```ts file=./http_router_usage-samples/testing_url_encoded_body.ts
```

#### `TestReqMultipartFormDataBody`

Simulates a `multipart/form-data` payload with optional text fields and file uploads:

```ts file=./http_router_usage-samples/testing_multipart_body.ts
```

#### `TestReqCustom`

Passes `data` through as-is for arbitrary payloads:

```ts file=./http_router_usage-samples/testing_custom_body.ts
```

### Using the context for request-scoped data

The shared `context` object is useful for passing data between middleware and handlers:

```ts file=./http_router_usage-samples/request_scoped_context.ts
```

### Using invocable objects as handlers and middleware

Both handlers and middleware can be invocable objects (classes with an `invoke` method), which allows them to encapsulate state. This pattern is designed for seamless integration with dependency injection libraries, as most DI frameworks have first-class support for classes.

**Handler example** using `IHttpHandlerObject`:

```ts file=./http_router_usage-samples/invocable_handler.ts
```

**Middleware example** using `IHttpMiddlewareObject`:

```ts file=./http_router_usage-samples/invocable_middleware.ts
```

:::info
For further information about invocable objects, refer to the [`Invocable`](../../utilities/invocable.md) documentation.
:::

### Interoperability with Winter TC standard web request handlers

A Winter TC handler is a function with the signature `(request: Request) => Promise<Response> | Response`. Since `HttpRouter` endpoints expect the richer `HttpHandlerArgs` interface, you can use the `HttpRouter.fromWinterTcHandler()` static method to bridge the two seamlessly:

```ts file=./http_router_usage-samples/winter_tc_handler.ts
```

The method internally passes `req.webReq` (the underlying Web API `Request`) to the Winter TC handler and converts the returned `Response` into an `IHttpRes` via `fromWebRes()`.

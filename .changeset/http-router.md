---
"@daiso-tech/core": minor
---

Add new `HttpRouter` component — a framework-agnostic HTTP router implementing the Winter TC fetch standard.

Key features:

- **Winter TC compliant** — Exposes a standard `fetch(request: Request): Response` signature compatible with any runtime (Node.js, Bun, Deno, Cloudflare Workers, etc.)
- **Typed routing** — Path parameters, optional parameters, wildcards, regex-constrained parameters, and method matching
- **Route grouping** — Prefix-based route grouping with nesting support
- **Three middleware layers** — Router-level Winter TC middleware, shared middleware via `router.use()`, and endpoint-specific middleware via `middlewares` builder
- **Rich request handling** — `HttpReq` with access to JSON body, form data (including file uploads), path/query parameters, headers, cookies, and Standard Schema validation
- **Fluent response builder** — `HttpRes` with status codes, headers, cookie management (set, remove, check, strip), and helpers for `text()`, `html()`, `json()`, `notFound()`, `redirect()`, `permanentRedirect()`
- **Winter TC interoperability** — `HttpRouter.fromWinterTcHandler()` static method to adapt Winter TC handlers for use as endpoint handlers, plus `WinterTcMiddlewareFn`, `IWinterTcMiddlewareObject`, and `defineWinterTcMiddleware`
- **Typed HTTP errors** — `HttpError` class for structured error responses with status codes
- **File upload support** — `HttpFile` with content access methods (text, bytes, stream, buffer) and file properties
- **Testing utilities** — `HttpReq.test()` with `TestReqSettings` for creating synthetic requests with mocked params, headers, cookies, and body variants (JSON, URL-encoded, multipart, custom)
- **Composable architecture** — Built on Hono's router engine (SmartRouter, RegExpRouter, TrieRouter) with support for custom router adapters

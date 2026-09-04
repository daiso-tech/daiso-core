---
sidebar_position: 2
sidebar_label: Configuring adapters
pagination_label: Configuring HttpRouter adapters
tags:
    - HttpRouter
    - Configuring adapters
    - Hono
keywords:
    - HttpRouter
    - Configuring adapters
    - Hono
---

# Configuring HttpRouter adapters

`HttpRouter` is adapter-based: it delegates URL pattern matching to a Hono `Router` instance. Any existing Hono-compatible adapter can be used interchangeably with the `HttpRouter` class.

## SmartRouter

`SmartRouter` is the recommended adapter. It composes multiple routers and automatically selects the best matching router for each route.

`eridu-tech/http-router` exports [`defaultHttpRouterAdapter`](https://eridu-tech.github.io/eridu-tech-core/variables/HttpRouter.defaultHttpRouterAdapter.html) to reduce boilerplate. It is equivalent to:

```ts file=./configuring_http_router_adapters-samples/smart_router_default_equivalent.ts
```

```ts file=./configuring_http_router_adapters-samples/smart_router_default.ts
```

You can also configure `SmartRouter` explicitly:

```ts file=./configuring_http_router_adapters-samples/smart_router_explicit.ts
```

:::info
`SmartRouter` provides the best all-around performance by delegating each route to the optimal underlying router. Prefer it unless you have a specific reason to use a single router.
:::

## RegExpRouter

`RegExpRouter` compiles all routes into a single regular expression for fast matching. It is best suited for applications with many static routes.

```ts file=./configuring_http_router_adapters-samples/regexp_router.ts
```

## TrieRouter

`TrieRouter` performs linear trie traversal for route matching. It is best suited for applications with many dynamic path parameters.

```ts file=./configuring_http_router_adapters-samples/trie_router.ts
```

## LinearRouter

`LinearRouter` registers routes very quickly, making it suitable for environments that initialize applications on every request.

```ts file=./configuring_http_router_adapters-samples/linear_router.ts
```

## PatternRouter

`PatternRouter` is the smallest router, simply adding and matching patterns. It is best suited for minimal footprint applications.

```ts file=./configuring_http_router_adapters-samples/pattern_router.ts
```

## Further information

For further information refer to:

- [Hono Routing — official documentation](https://hono.dev/docs/concepts/routers)

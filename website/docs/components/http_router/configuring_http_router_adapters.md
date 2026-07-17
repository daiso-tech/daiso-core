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

`@daiso-tech/core/http-router` exports [`defaultHttpRouterAdapter`](https://daiso-tech.github.io/daiso-core/variables/HttpRouter.defaultHttpRouterAdapter.html) to reduce boilerplate. It is equivalent to:

```ts
new SmartRouter({
    routers: [new RegExpRouter(), new TrieRouter()],
});
```

```ts
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";

new HttpRouter({ router: defaultHttpRouterAdapter });
```

You can also configure `SmartRouter` explicitly:

```ts
import { HttpRouter } from "@daiso-tech/core/http-router";
import { SmartRouter } from "hono/router/smart-router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { TrieRouter } from "hono/router/trie-router";

new HttpRouter({
    router: new SmartRouter({
        routers: [new RegExpRouter(), new TrieRouter()],
    }),
});
```

:::info
`SmartRouter` provides the best all-around performance by delegating each route to the optimal underlying router. Prefer it unless you have a specific reason to use a single router.
:::

## RegExpRouter

`RegExpRouter` compiles all routes into a single regular expression for fast matching. It is best suited for applications with many static routes.

```ts
import { HttpRouter } from "@daiso-tech/core/http-router";
import { RegExpRouter } from "hono/router/reg-exp-router";

new HttpRouter({ router: new RegExpRouter() });
```

## TrieRouter

`TrieRouter` performs linear trie traversal for route matching. It is best suited for applications with many dynamic path parameters.

```ts
import { HttpRouter } from "@daiso-tech/core/http-router";
import { TrieRouter } from "hono/router/trie-router";

new HttpRouter({ router: new TrieRouter() });
```

## LinearRouter

`LinearRouter` registers routes very quickly, making it suitable for environments that initialize applications on every request.

```ts
import { HttpRouter } from "@daiso-tech/core/http-router";
import { LinearRouter } from "hono/router/linear-router";

new HttpRouter({ router: new LinearRouter() });
```

## PatternRouter

`PatternRouter` is the smallest router, simply adding and matching patterns. It is best suited for minimal footprint applications.

```ts
import { HttpRouter } from "@daiso-tech/core/http-router";
import { PatternRouter } from "hono/router/pattern-router";

new HttpRouter({ router: new PatternRouter() });
```

## Further information

For further information refer to:

- [Hono Routing — official documentation](https://hono.dev/docs/concepts/routers)

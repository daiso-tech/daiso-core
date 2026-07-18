---
sidebar_position: 1
sidebar_label: Deno
pagination_label: Deno
tags:
    - HttpRouter
    - Deno
keywords:
    - HttpRouter
    - Deno
---

# Deno

Deno provides the native `Deno.serve()` function which accepts a standard fetch handler.

### 1. Install

```sh
deno add npm:@daiso-tech/core npm:hono
```

### 2. Create the handler

```ts
// main.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Deno!"),
});

Deno.serve((request) => router.fetch(request));
```

**File structure**

```
.
├── main.ts
└── deno.json
```

### 3. Develop

```sh
deno run --allow-net --watch main.ts
```

### 4. Deploy

```sh
deno run --allow-net main.ts
```

To deploy to **Deno Deploy**, link your GitHub repository or use `deployctl`:

```sh
deployctl deploy --project=my-project main.ts
```

**Reference:** [Deno HTTP Server](https://docs.deno.com/runtime/tutorials/http_server), [Hono on Deno](https://hono.dev/docs/getting-started/deno)

---
sidebar_position: 2
sidebar_label: Bun
pagination_label: Bun
tags:
    - HttpRouter
    - Bun
keywords:
    - HttpRouter
    - Bun
---

# Bun

Bun's `Bun.serve()` accepts a standard fetch handler directly.

### 1. Install

```sh
bun add eridu-tech hono
```

### 2. Create the handler

```ts
// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Bun!"),
});

export default {
    port: 3000,
    fetch: (request: Request) => router.fetch(request),
};
```

**File structure**

```
.
├── src
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 3. Develop

```sh
bun run --hot src/index.ts
```

### 4. Deploy

```sh
bun run src/index.ts
```

**Reference:** [Bun HTTP Server](https://bun.sh/docs/api/http), [Hono on Bun](https://hono.dev/docs/getting-started/bun)

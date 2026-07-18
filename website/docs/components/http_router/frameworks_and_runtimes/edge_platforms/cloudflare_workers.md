---
sidebar_position: 1
sidebar_label: Cloudflare Workers
pagination_label: Cloudflare Workers
tags:
    - HttpRouter
    - Cloudflare Workers
keywords:
    - HttpRouter
    - Cloudflare Workers
---

# Cloudflare Workers

Export `router.fetch` as the default module fetch handler.

### 1. Install

```sh
npm install @daiso-tech/core hono
npm install -D @cloudflare/workers-types wrangler
```

### 2. Create the handler

```ts
// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Cloudflare Workers!"),
});

export default { fetch: (request: Request) => router.fetch(request) };
```

**File structure**

```
.
├── src
│   └── index.ts
├── package.json
├── tsconfig.json
└── wrangler.toml
```

**`wrangler.toml`**

```toml
name = "my-app"
main = "src/index.ts"
compatibility_date = "2025-01-01"
```

### 3. Develop

```sh
npx wrangler dev
```

### 4. Deploy

```sh
npx wrangler deploy
```

**Limitations:** Cloudflare Workers have a CPU time limit (10ms–30s depending on plan). No filesystem access. Use Workers KV, R2, or D1 for storage.

**Reference:** [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)

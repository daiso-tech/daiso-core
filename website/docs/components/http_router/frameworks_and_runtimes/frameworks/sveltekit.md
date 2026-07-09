---
sidebar_position: 5
sidebar_label: SvelteKit
pagination_label: SvelteKit
tags:
    - HttpRouter
    - SvelteKit
keywords:
    - HttpRouter
    - SvelteKit
---

# SvelteKit

`HttpRouter` works with SvelteKit server endpoints via the standard `Request`/`Response` API.

### 1. Install

```sh
npm install @daiso-tech/core hono
```

### 2. Create the handler

```ts
// src/routes/api/[...route]/+server.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import type { RequestHandler } from "./$types";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from SvelteKit!"),
});

export const GET: RequestHandler = async ({ request }) => router.fetch(request);
export const POST: RequestHandler = async ({ request }) =>
    router.fetch(request);
export const PUT: RequestHandler = async ({ request }) => router.fetch(request);
export const DELETE: RequestHandler = async ({ request }) =>
    router.fetch(request);
export const PATCH: RequestHandler = async ({ request }) =>
    router.fetch(request);
```

**File structure**

```
.
├── src
│   └── routes
│       └── api
│           └── [...route]
│               └── +server.ts
├── package.json
└── svelte.config.js
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

**Reference:** [SvelteKit Server Endpoints](https://kit.svelte.dev/docs/routing#server)

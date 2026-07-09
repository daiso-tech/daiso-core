---
sidebar_position: 1
sidebar_label: Next.js App Router
pagination_label: Next.js App Router
tags:
    - HttpRouter
    - Next.js App Router
keywords:
    - HttpRouter
    - Next.js App Router
---

# Next.js App Router

`HttpRouter` can be used directly with Next.js App Router route handlers.

### 1. Install

```sh
npm install @daiso-tech/core hono
```

### 2. Create the handler

```ts
// app/api/[[...route]]/route.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { handle } from "hono/vercel";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from Next.js!"),
});

export const GET = handle(router);
export const HEAD = handle(router);
export const POST = handle(router);
export const PUT = handle(router);
export const DELETE = handle(router);
export const PATCH = handle(router);
export const OPTIONS = handle(router);
```

**File structure**

```
.
├── app
│   └── api
│       └── [[...route]]
│           └── route.ts
├── package.json
└── next.config.js
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

### 5. Start

```sh
npm start
```

:::info
Next.js automatically maps HTTP methods to the exported handler names (`GET`, `POST`, etc.). Route groups and prefixes defined via `HttpRouter.route()` map to the file-system route.
:::

**Reference:** [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

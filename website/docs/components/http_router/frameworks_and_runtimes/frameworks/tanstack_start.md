---
sidebar_position: 7
sidebar_label: TanStack Start
pagination_label: TanStack Start
tags:
    - HttpRouter
    - TanStack Start
keywords:
    - HttpRouter
    - TanStack Start
---

# TanStack Start

TanStack Start uses Vinxi under the hood and supports standard fetch handlers.

### 1. Install

```sh
npm install @daiso-tech/core hono
```

### 2. Create the handler

```ts
// app/routes/api/$.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from TanStack Start!"),
});

export const Route = createFileRoute("/api/$")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                return router.fetch(request);
            },
            HEAD: async ({ request }) => {
                return router.fetch(request);
            },
            PUT: async ({ request }) => {
                return router.fetch(request);
            },
            DELETE: async ({ request }) => {
                return router.fetch(request);
            },
            PATCH: async ({ request }) => {
                return router.fetch(request);
            },
            OPTIONS: async ({ request }) => {
                return router.fetch(request);
            },
        },
    },
});
```

**File structure**

```
.
├── app
│   └── routes
│       └── api
│           └── $.ts
├── package.json
└── app.config.ts
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

**Reference:** [TanStack Start API Routes](https://tanstack.com/start/latest/docs/framework/react/api-routes)

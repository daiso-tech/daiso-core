---
sidebar_position: 6
sidebar_label: SolidStart
pagination_label: SolidStart
tags:
    - HttpRouter
    - SolidStart
keywords:
    - HttpRouter
    - SolidStart
---

# SolidStart

SolidStart supports fetch-based route handlers natively.

### 1. Install

```sh
npm install @daiso-tech/core hono
```

### 2. Create the handler

```ts
// src/routes/api/[...route].ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import type { APIEvent } from "@solidjs/start/server";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from SolidStart!"),
});

export const GET = ({ request }: APIEvent) => router.fetch(request);
export const HEAD = ({ request }: APIEvent) => router.fetch(request);
export const POST = ({ request }: APIEvent) => router.fetch(request);
export const PUT = ({ request }: APIEvent) => router.fetch(request);
export const DELETE = ({ request }: APIEvent) => router.fetch(request);
export const PATCH = ({ request }: APIEvent) => router.fetch(request);
export const OPTIONS = ({ request }: APIEvent) => router.fetch(request);
```

**File structure**

```
.
├── src
│   └── routes
│       └── api
│           └── [...route].ts
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

**Reference:** [SolidStart API Routes](https://start.solidjs.com/api-routes)

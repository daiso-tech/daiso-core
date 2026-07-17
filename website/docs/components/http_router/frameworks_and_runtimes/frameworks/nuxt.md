---
sidebar_position: 3
sidebar_label: Nuxt
pagination_label: Nuxt
tags:
    - HttpRouter
    - Nuxt
keywords:
    - HttpRouter
    - Nuxt
---

# Nuxt

`HttpRouter` integrates with Nuxt server routes via [Nitro](https://nitro.unjs.io/) and [h3](https://h3.unjs.io/). Use [`toWebRequest`](https://v1.h3.dev/utils/request#towebrequest-event) from `h3` to convert the incoming event to a standard `Request`.

### 1. Install

```sh
npm install @daiso-tech/core hono
```

### 2. Create the handler

```ts
// server/api/[...].ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { defineEventHandler, toWebRequest } from "h3";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from Nuxt!"),
});

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event);
    return router.fetch(request);
});
```

**File structure**

```
.
├── server
│   └── api
│       └── [...].ts
├── package.json
└── nuxt.config.ts
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

**Reference:** [Nuxt Server Routes](https://nuxt.com/docs/guide/directory-structure/server)

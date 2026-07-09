---
sidebar_position: 4
sidebar_label: Analog.js
pagination_label: Analog.js
tags:
    - HttpRouter
    - Analog.js
keywords:
    - HttpRouter
    - Analog.js
---

# Analog.js

Analog.js API routes are powered by [Nitro](https://nitro.unjs.io/) and [h3](https://h3.unjs.io/). Use [`toWebRequest`](https://v1.h3.dev/utils/request#towebrequest-event) from `h3` to convert the incoming event to a standard `Request`.

### 1. Install

```sh
npm install @daiso-tech/core hono
```

### 2. Create the handler

```ts
// src/server/routes/api/[...].ts
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
    handler: async () => HttpRes.text("Hello from Analog!"),
});

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event);
    return router.fetch(request);
});
```

**File structure**

```
.
├── src
│   └── server
│       └── routes
│           └── api
│               └── [...].ts
├── package.json
└── vite.config.ts
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

**Reference:** [Analog API Routes](https://analogjs.org/docs/features/api/overview)

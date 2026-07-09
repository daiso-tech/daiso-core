---
sidebar_position: 3
sidebar_label: Node.js
pagination_label: Node.js
tags:
    - HttpRouter
    - Node.js
keywords:
    - HttpRouter
    - Node.js
---

# Node.js

Use the `@hono/node-server` adapter to serve `HttpRouter` on Node.js.

### 1. Install

```sh
npm install @daiso-tech/core hono @hono/node-server
```

### 2. Create the handler

```ts
// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { serve } from "@hono/node-server";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Node.js!"),
});

const server = serve({
    fetch: (request: Request) => router.fetch(request),
    port: 3000,
});

// Graceful shutdown
process.on("SIGINT", () => {
    server.close();
    process.exit(0);
});
process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
});
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
npx tsx watch src/index.ts
```

### 4. Build

```sh
npx tsc
```

### 5. Deploy

```sh
node dist/index.js
```

**Dockerfile**

```Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build && npm prune --production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Reference:** [Hono on Node.js](https://hono.dev/docs/getting-started/nodejs)

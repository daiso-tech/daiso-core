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
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./nextjs_app_router-samples/create_handler.ts
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

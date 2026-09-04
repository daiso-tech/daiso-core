---
sidebar_position: 2
sidebar_label: Next.js Pages Router
pagination_label: Next.js Pages Router
tags:
    - HttpRouter
    - Next.js Pages Router
keywords:
    - HttpRouter
    - Next.js Pages Router
---

# Next.js Pages Router

`HttpRouter` can be used directly with Next.js Pages Router route handlers.

### 1. Install

```sh
npm install eridu-tech hono @hono/node-server
```

### 2. Create the handler

```ts file=./nextjs_pages_router-samples/create_handler.ts
```

**File structure**

```
.
├── pages
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
In order for this to work with the Pages Router, disable Vercel Node.js helpers by setting an environment variable in your project dashboard or in your `.env` file:

```sh
NODEJS_HELPERS=0
```

:::

**Reference:** [Next.js Pages Router API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

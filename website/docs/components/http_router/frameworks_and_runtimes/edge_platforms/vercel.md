---
sidebar_position: 3
sidebar_label: Vercel
pagination_label: Vercel
tags:
    - HttpRouter
    - Vercel
keywords:
    - HttpRouter
    - Vercel
---

# Vercel

Deploy `HttpRouter` to Vercel serverless or edge functions by exporting the default fetch handler.

### 1. Install

```sh
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./vercel-samples/create_handler.ts
```

**File structure**

```
.
├── api
│   └── index.ts
├── package.json
└── vercel.json
```

**`vercel.json`**

```json
{
    "rewrites": [{ "source": "/api/(.*)", "destination": "/api" }]
}
```

### 3. Develop

```sh
vercel dev
```

### 4. Deploy

```sh
vercel deploy --prod
```

**Reference:** [Hono on Vercel](https://hono.dev/docs/getting-started/vercel)

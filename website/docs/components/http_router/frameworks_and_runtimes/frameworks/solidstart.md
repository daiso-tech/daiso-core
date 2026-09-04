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
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./solidstart-samples/create_handler.ts
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

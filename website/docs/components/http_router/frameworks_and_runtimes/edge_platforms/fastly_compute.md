---
sidebar_position: 2
sidebar_label: Fastly Compute
pagination_label: Fastly Compute
tags:
    - HttpRouter
    - Fastly Compute
keywords:
    - HttpRouter
    - Fastly Compute
---

# Fastly Compute

Use the [`@fastly/hono-fastly-compute`](https://github.com/fastly/hono-fastly-compute) adapter with the `fire` helper.

### 1. Install

```sh
npm install eridu-tech hono @fastly/hono-fastly-compute
```

### 2. Create the handler

```ts file=./fastly_compute-samples/create_handler.ts
```

**File structure**

```
.
├── src
│   └── index.ts
├── package.json
└── fastly.toml
```

### 3. Develop

```sh
npm run start
```

### 4. Deploy

```sh
npm run deploy
```

**Reference:** [Hono on Fastly](https://hono.dev/docs/getting-started/fastly)

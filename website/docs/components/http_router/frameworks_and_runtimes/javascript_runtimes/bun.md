---
sidebar_position: 2
sidebar_label: Bun
pagination_label: Bun
tags:
    - HttpRouter
    - Bun
keywords:
    - HttpRouter
    - Bun
---

# Bun

Bun's `Bun.serve()` accepts a standard fetch handler directly.

### 1. Install

```sh
bun add eridu-tech hono
```

### 2. Create the handler

```ts file=./bun-samples/create_handler.ts
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
bun run --hot src/index.ts
```

### 4. Deploy

```sh
bun run src/index.ts
```

**Reference:** [Bun HTTP Server](https://bun.sh/docs/api/http), [Hono on Bun](https://hono.dev/docs/getting-started/bun)

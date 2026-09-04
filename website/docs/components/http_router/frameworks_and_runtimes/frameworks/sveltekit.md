---
sidebar_position: 5
sidebar_label: SvelteKit
pagination_label: SvelteKit
tags:
    - HttpRouter
    - SvelteKit
keywords:
    - HttpRouter
    - SvelteKit
---

# SvelteKit

`HttpRouter` works with SvelteKit server endpoints via the standard `Request`/`Response` API.

### 1. Install

```sh
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./sveltekit-samples/create_handler.ts
```

**File structure**

```
.
├── src
│   └── routes
│       └── api
│           └── [...route]
│               └── +server.ts
├── package.json
└── svelte.config.js
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

**Reference:** [SvelteKit Server Endpoints](https://kit.svelte.dev/docs/routing#server)

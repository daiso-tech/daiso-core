---
sidebar_position: 4
sidebar_label: Netlify
pagination_label: Netlify
tags:
    - HttpRouter
    - Netlify
keywords:
    - HttpRouter
    - Netlify
---

# Netlify

Use the `hono/netlify` adapter to wrap `HttpRouter` for Netlify Edge Functions.

### 1. Install

```sh
npm install @daiso-tech/core hono
```

### 2. Create the handler

```ts
// netlify/edge-functions/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { handle } from "hono/netlify";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Netlify!"),
});

export default handle(router);
```

**File structure**

```
.
├── netlify
│   └── edge-functions
│       └── index.ts
├── package.json
└── netlify.toml
```

**`netlify.toml`**

```toml
[build]
  command = "npm run build"

[[edge_functions]]
  function = "index"
  path = "/*"
```

### 3. Develop

```sh
netlify dev
```

### 4. Deploy

```sh
netlify deploy --prod
```

**Reference:** [Hono on Netlify](https://hono.dev/docs/getting-started/netlify)

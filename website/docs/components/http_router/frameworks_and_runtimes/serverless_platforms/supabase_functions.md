---
sidebar_position: 1
sidebar_label: Supabase Functions
pagination_label: Supabase Functions
tags:
    - HttpRouter
    - Supabase Functions
keywords:
    - HttpRouter
    - Supabase Functions
---

# Supabase Functions

Supabase Edge Functions run on Deno. `HttpRouter` integrates natively.

### 1. Install

No installation needed — Supabase Functions use Deno with import maps.

### 2. Create the handler

```ts
// supabase/functions/hello-world/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "npm:@daiso-tech/core/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello-world/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Supabase!"),
});

Deno.serve((request: Request) => router.fetch(request));
```

**File structure**

```
.
├── supabase
│   └── functions
│       └── hello-world
│           └── index.ts
└── supabase
    └── config.toml
```

### 3. Develop

```sh
supabase start
supabase functions serve --no-verify-jwt
```

### 4. Deploy

```sh
supabase functions deploy hello-world
```

**Reference:** [Hono on Supabase](https://hono.dev/docs/getting-started/supabase-functions)

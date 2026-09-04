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
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./netlify-samples/create_handler.ts
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

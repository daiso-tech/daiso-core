---
sidebar_position: 1
sidebar_label: Deno
pagination_label: Deno
tags:
    - HttpRouter
    - Deno
keywords:
    - HttpRouter
    - Deno
---

# Deno

Deno provides the native `Deno.serve()` function which accepts a standard fetch handler.

### 1. Install

```sh
deno add npm:eridu-tech npm:hono
```

### 2. Create the handler

```ts file=./deno-samples/create_handler.ts
```

**File structure**

```
.
├── main.ts
└── deno.json
```

### 3. Develop

```sh
deno run --allow-net --watch main.ts
```

### 4. Deploy

```sh
deno run --allow-net main.ts
```

To deploy to **Deno Deploy**, link your GitHub repository or use `deployctl`:

```sh
deployctl deploy --project=my-project main.ts
```

**Reference:** [Deno HTTP Server](https://docs.deno.com/runtime/tutorials/http_server), [Hono on Deno](https://hono.dev/docs/getting-started/deno)

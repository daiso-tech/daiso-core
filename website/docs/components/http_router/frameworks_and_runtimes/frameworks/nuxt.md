---
sidebar_position: 3
sidebar_label: Nuxt
pagination_label: Nuxt
tags:
    - HttpRouter
    - Nuxt
keywords:
    - HttpRouter
    - Nuxt
---

# Nuxt

`HttpRouter` integrates with Nuxt server routes via [Nitro](https://nitro.unjs.io/) and [h3](https://h3.unjs.io/). Use [`toWebRequest`](https://v1.h3.dev/utils/request#towebrequest-event) from `h3` to convert the incoming event to a standard `Request`.

### 1. Install

```sh
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./nuxt-samples/create_handler.ts
```

**File structure**

```
.
├── server
│   └── api
│       └── [...].ts
├── package.json
└── nuxt.config.ts
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

**Reference:** [Nuxt Server Routes](https://nuxt.com/docs/guide/directory-structure/server)

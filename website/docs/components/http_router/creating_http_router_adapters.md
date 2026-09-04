---
sidebar_position: 3
sidebar_label: Creating adapters
pagination_label: Creating HttpRouter adapters
tags:
    - HttpRouter
    - Creating adapters
keywords:
    - HttpRouter
    - Creating adapters
---

# Creating HttpRouter adapters

`HttpRouter` relies on the **Hono router adapter interface** for URL pattern matching and request dispatching. It does **not** ship with a built-in router. Instead, you supply a Hono `Router` instance that satisfies the adapter interface.

## Implementing your custom Router adapter

In order to create an adapter you need to implement the [`Router`](https://github.com/honojs/hono/blob/main/src/router.ts) contract from Hono. The interface defines three members:

```ts file=./creating_http_router_adapters-samples/router_adapter_contract.ts
```

## Further information

For further information refer to:

- [Hono GitHub repository](https://github.com/honojs/hono): source code for the Hono framework, including the router adapters (`hono/router`).
- [Hono Routing official documentation](https://hono.dev/docs/concepts/routers): guide to Hono's routing system, including path patterns, route grouping, and router selection.

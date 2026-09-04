---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Cache resolver classes
tags:
    - Cache
    - Resolvers
keywords:
    - Cache
    - Resolvers
---

# CacheResolver

The `CacheResolver` class provides a flexible way to configure and switch between different cache adapters at runtime.

## Initial configuration

To begin using the `CacheResolver`, you will need to register all required adapters during initialization.

```ts file=./cache_resolver-samples/cache_resolver_initial_config.ts
```

## Usage

### 1. Using the default adapter

```ts file=./cache_resolver-samples/cache_resolver_default_adapter.ts
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts file=./cache_resolver-samples/cache_resolver_specific_adapter.ts
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

The `CacheResolver` provides chainable methods to override the base configuration per-use:

```ts file=./cache_resolver-samples/cache_resolver_override_settings.ts
```

You can also change the type parameter for compile-time type safety:

```ts file=./cache_resolver-samples/cache_resolver_set_type.ts
```

:::info
Note that the `CacheResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.

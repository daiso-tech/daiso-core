---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: Cache middlewares
tags:
    - Cache
    - Middlewares
    - AOP
keywords:
    - Cache
    - Middlewares
    - AOP
---

# Cache middlewares

## withCacheFactory middleware

The Cache middleware intercepts function calls and caches their return values using a configurable cache store. When the wrapped function is invoked, the middleware derives a cache key from the function's arguments. If the key exists in the cache, the cached value is returned immediately without executing the function. Otherwise, the function runs, its result is stored in the cache, and the result is returned.

### Usage

```ts file=./cache_middlewares-samples/with_cache_factory.ts
```

:::info
Here is a complete list of settings for the [`withCache`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.WithCacheSettings.html) function.
:::

## withInvalidationFactory middleware

The Cache invalidation middleware intercepts function calls and invalidates a cache entry after the wrapped function has been invoked. The cache key is derived from the function's arguments via the `key` setting. After the wrapped function runs, the `shouldInvalidate` setting decides whether to invalidate based on the function's arguments and return value; when it returns `true` (the default), the cache entry is removed from the provided `ICache`.

This is useful for write-invalidation caching patterns, where stale cached data must be cleared after a mutation.

### Usage

```ts file=./cache_middlewares-samples/with_invalidation.ts
```

:::info
Here is a complete list of settings for the [`withInvalidation`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.WithInvalidationSettings.html) function.
:::

### Settings

| Option             | Type                                                            | Description                                                                                                                                         |
| ------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`              | `Invocable<TParameters, string>`                                | A function (or invocable object) that produces the cache key from the wrapped function's arguments                                                  |
| `shouldInvalidate` | `Invocable<[args: TParameters, returnValue: TReturn], boolean>` | Determines whether to invalidate the cache entry after the wrapped function runs, based on its arguments and return value. Defaults to `() => true` |

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.

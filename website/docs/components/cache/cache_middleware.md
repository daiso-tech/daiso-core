---
sidebar_position: 5
sidebar_label: Middleware
pagination_label: Cache middleware
tags:
    - Cache
    - Middlewares
    - AOP
keywords:
    - Cache
    - Middlewares
    - AOP
---

# Cache middleware

The Cache middleware intercepts function calls and caches their return values using a configurable cache store. When the wrapped function is invoked, the middleware derives a cache key from the function's arguments. If the key exists in the cache, the cached value is returned immediately without executing the function. Otherwise, the function runs, its result is stored in the cache, and the result is returned.

## Initial setup

```ts
import { withCacheFactory } from "@daiso-tech/core/cache/middlewares";
import { Cache } from "@daiso-tech/core/cache";
import { useFactory } from "@daiso-tech/core/middleware";

const cache = Cache({
    adapter: new MemoryCacheAdapter(),
});

const withCache = withCacheFactory(cache);

const use = useFactory();
```

:::info
Here is a complete list of settings for the [`WithCache`](https://daiso-tech.github.io/daiso-core/types/Cache.WithCacheSettings.html) function.
:::

## Usage

```ts
const fetchUser = async (userId: string): Promise<{ name: string }> => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
};

// Wrap with caching
const cachedFetchUser = use(
    fetchUser,
    withCache({
        key: (userId) => `user:${userId}`,
        ttl: new TimeSpan("10m"), // Cache for 10 minutes
    }),
);

const user = await cachedFetchUser("123"); // Cache miss — fetches and caches
const userAgain = await cachedFetchUser("123"); // Cache hit — returns immediately
```

## Further information

For further information refer to [`@daiso-tech/core/cache`](https://daiso-tech.github.io/daiso-core/modules/Cache.html) API docs.

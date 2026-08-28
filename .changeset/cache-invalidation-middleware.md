---
"eridu-tech": minor
---

Added the `withInvalidationFactory` middleware to `eridu-tech/cache/middlewares`.

`withInvalidationFactory` creates a middleware that invalidates a cache entry after the wrapped function has been invoked. The cache key is derived from the wrapped function's arguments via the `key` setting. After the wrapped function runs, the `shouldInvalidate` setting decides whether to invalidate based on the function's arguments and return value; when it returns `true` (the default), the cache entry is removed from the provided `ICache`.

This is useful for write-invalidation caching patterns, where stale cached data must be cleared after a mutation.

### Usage

```ts
import { use } from "eridu-tech/middleware";
import {
    withCacheFactory,
    withInvalidationFactory,
} from "eridu-tech/cache/middlewares";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Cache } from "eridu-tech/cache";

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
});
const withCache = withCacheFactory(cache);
const withInvalidation = withInvalidationFactory(cache);

async function getUser(userId: string): Promise<User> {
    return fetchUser(userId);
}

// Cache the result of getUser keyed by the user id
const getCachedUser = use(
    getUser,
    withCache({
        key: (userId: string) => `user:${userId}`,
    }),
);

async function updateUser(user: User): Promise<void> {
    await saveUser(user);
}

// Invalidate the cached user after saving the updated version
const updateUserWithInvalidation = use(
    updateUser,
    withInvalidation({
        key: (user: User) => `user:${user.id}`,
    }),
);
```

### Settings

| Option             | Type                                                           | Description                                                                                                 |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `key`              | `Invocable<TParameters, string>`                               | A function (or invocable object) that produces the cache key from the wrapped function's arguments           |
| `shouldInvalidate` | `Invocable<[args: TParameters, returnValue: TReturn], boolean>` | Determines whether to invalidate the cache entry after the wrapped function runs, based on its arguments and return value. Defaults to `() => true` |

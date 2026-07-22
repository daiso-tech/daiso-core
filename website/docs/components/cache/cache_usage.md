---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Cache usage
tags:
    - Cache
    - Usage
    - Namespace
keywords:
    - Cache
    - Usage
    - Namespace
---

# Cache usage

The `@daiso-tech/core/cache` component provides a way for storing key-value pairs with expiration independent of data storage

## Initial configuration

To begin using the `Cache` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

const cache = new Cache({
    // You can provide default TTL value
    // If you set it to null it means keys will be stored forever.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemoryCacheAdapter(),
});
```

:::info
Here is a complete list of settings for the [`Cache`](https://daiso-tech.github.io/daiso-core/types/Cache.CacheSettingsBase.html) class.
:::

## Cache basics

### Adding keys

You can add a key with a optional TTL to overide the default:

```ts
await cache.add("a", "value", TimeSpan.fromSeconds(1));
```

The method returns true if the key does not exists.

### Retrieving keys

You can retrieve the key:

```ts
await cache.get("a");
```

### Checking key existence

You can check if the key exists:

```ts
await cache.exists("a");
```

You can check if the key is missing:

```ts
await cache.missing("a");
```

### Updating keys

You can update a key and true will be returned if the key exists and was updated:

```ts
await cache.update("a", 2);
```

You can increment the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown:

```ts
await cache.increment("a", 2);
```

You can decrement the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown,:

```ts
await cache.decrement("a", 1);
```

You can perform an upsert that replaces the ttl when updated. True will be returned if the key was updated otherwise false is returned:

```ts
await cache.put("a", 2);
await cache.put("a", 4, TimeSpan.fromSeconds(3));
```

### Removing keys

You can remove a key and true will be returned if the key was found and removed:

```ts
await cache.remove("a");
```

You can remove multiple keys and true will be returned if one of the keys exists and where removed:

```ts
await cache.removeMany(["a", "b"]);
```

You can clear all the keys of the given namespace:

```ts
await cache.clear();
```

## Patterns

### Compile time type safety

You can enforce compile time type safety by setting the cache value type:

```ts
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

type IUser = {
    name: string;
    email: string;
    age: number;
};

const cache = new Cache<IUser>({
    adapter: new MemoryCacheAdapter(),
});

// A typescript error will occur because the type is not matching.
await cache.add("a", "asd");
```

If you have multiple types you can use algeberical enums:

```ts
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

type IUser = {
    type: "USER";
    name: string;
    email: string;
    age: number;
};
type IProduct = {
    type: "PRODUCT";
    name: string;
    price: number;
};
type CacheValue = IUser | IProduct;

const cache = new Cache<CacheValue>({
    adapter: new MemoryCacheAdapter(),
});

const cacheValue = await cache.get("user1");
// You need to check the type is "USER" inorder to access IUser fields.
if (cacheValue.type === "USER") {
    console.log(cacheValue.name, cacheValue.age);
}
// You need to check the type is "PRODUCT" inorder to access IProduct fields.
if (cacheValue.type === "PRODUCT") {
    console.log(cacheValue.name, cacheValue.price);
}
```

Alternatively you can use different `Cache` classes with different namespaces:

```ts
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

const cacheAdapter = new MemoryCacheAdapter();

type IUser = {
    name: string;
    email: string;
    age: number;
};
const userCache = new Cache<IUser>({
    adapter: cacheAdapter,
});

type IProduct = {
    name: string;
    price: number;
};
const productCache = new Cache<IProduct>({
    adapter: cacheAdapter,
});
```

### Runtime type safety

You can enforce runtime and compiletime type safety by applying the [`withCacheSchema`](cache_plugin.md#withcacheschema-plugin) plugin to the adapter:

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { withCacheSchema } from "@daiso-tech/core/cache/plugins";
import { z } from "zod";

const userSchema = z.object({
    name: z.string(),
    email: z.string(),
    age: z.number(),
});

const adapter = withPlugin(
    new MemoryCacheAdapter(),
    withCacheSchema({ schema: userSchema }),
);

// The type will be infered from the schema
const cache = new Cache({
    adapter,
});

// A typescript and runtime error will occur because the type is not matching.
await cache.add("a", "asd");
```

### Additional methods

You can retrieve the key and if it does not exist an error will be thrown:

```ts
await cache.getOrFail("ab");
```

You can retrieve the key and if it does not exist you can return a default value:

```ts
await cache.getOr("ab", 1);
```

You can retrieve the key and if it does not exist you can insert a default value that will aslo be returned:

```ts
await cache.getOrAdd("ab", 1);
```

:::info
You can provide synchronous or asynchronous [`Invokable<[], TValue | Promise<TValue>>`](../../utilities/invokable.md) as default values for both `getOr` and `getOrAdd` methods.
:::

You can retrieve the key and afterwards remove it:

```ts
await cache.getAndRemove("ab");
```

You can add key and if it does exist an error will be thrown:

```ts
await cache.addOrFail("ab", 1);
```

You can update the key and if it does not exist an error will be thrown:

```ts
await cache.updateOrFail("ab", 1);
```

You can increment the key and if it does not exist an error will be thrown:

```ts
await cache.incrementOrFail("ab", 1);
```

You can decrement the key and if it does not exist an error will be thrown:

```ts
await cache.decrementOrFail("ab", 1);
```

You can remove the key and if it does not exist an error will be thrown:

```ts
await cache.removeOrFail("ab");
```

### Adding jitter to ttl

TTL jitter adds a small random offset to expiration times, which resolves the [cache stampede](https://en.wikipedia.org/wiki/Cache_stampede). When many cache keys expire at the same time, every client simultaneously misses the cache and floods the data source with requests. By spreading out expiration times, jitter ensures cache misses are staggered, distributing the load on your data source evenly over time.

Apply the [`withCacheJitter`](cache_plugin.md#withcachejitter-plugin) plugin to the adapter:

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { withCacheJitter } from "@daiso-tech/core/cache/plugins";

const adapter = withPlugin(new MemoryCacheAdapter(), withCacheJitter());

const cache = new Cache({
    adapter,
});

await cache.add("a", 1, TimeSpan.fromMinutes(1));
```

:::info
For more information about jitter configuration, see the [`withCacheJitter`](cache_plugin.md#withcachejitter-plugin) plugin documentation.
:::

### Cache locking

The `getOrAdd` method supports distributed locking to prevent cache stampedes. When multiple clients simultaneously request a key that is missing, without locking they all compute the value and write it to the cache. Apply the [`withCacheWriteLock`](cache_plugin.md#withcachewritelock-plugin) plugin to the adapter to ensure that only one client computes and stores the value while the others wait and then read the cached result.

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { withCacheWriteLock } from "@daiso-tech/core/cache/plugins";
import { MemoryLockFactory } from "@daiso-tech/core/lock/memory-lock-factory";

const lockFactory = new MemoryLockFactory();
const adapter = withPlugin(
    new MemoryCacheAdapter(),
    withCacheWriteLock({ lockFactory }),
);

const cache = new Cache({
    adapter,
});

// The lock is automatically acquired for mutating operations
const value = await cache.getOrAdd(
    "user:1",
    async () => {
        // This expensive computation runs only once even under concurrent requests
        return await fetchUserFromDatabase(1);
    },
);
```

:::info
For further information about lock factories, refer to the [`@daiso-tech/core/lock`](../lock/lock_usage.md) documentation and the [`withCacheWriteLock`](cache_plugin.md#withcachewritelock-plugin) plugin documentation.
:::

### Separating cache reading from manipulation

The library includes 2 additional contracts:

- [`IReadableCache`](https://daiso-tech.github.io/daiso-core/types/Cache.IReadableCache.html) - Allows only for reading cache.

- [`ICache`](https://daiso-tech.github.io/daiso-core/types/Cache.ICache.html) - Allows for both reading and manipulating the cache.

This separation makes it easy to visually distinguish the two contracts, making it immediately obvious that they serve different purposes.

```ts
import type { ICache, IReadableCache } from "@daiso-tech/core/cache/contracts";
import { Cache } from "@daiso-tech/core/cache";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";

async function readingFunc(cache: IReadableCache): Promise<void> {
    // You cannot access write methods like put, add and update
    // You will get typescript error if you try

    console.log("reading only:", await cache.get("a"));
}
async function manipulatingFunc(cache: ICache): Promise<void> {
    // You will get typescript error if you try

    await cache.add("a", 1);
    console.log("writing and reading:", await cache.get("a"));
}

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
});
await manipulatingFunc(cache);
await readingFunc(cache);
```

## Further information

For further information refer to [`@daiso-tech/core/cache`](https://daiso-tech.github.io/daiso-core/modules/Cache.html) API docs.

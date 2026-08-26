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

```ts
import { CacheResolver } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { Serde } from "eridu-tech/serde";
import type { ISerde } from "eridu-tech/serde/contracts";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { TimeSpan } from "eridu-tech/time-span";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const cacheResolver = new CacheResolver({
    adapters: {
        memory: new MemoryCacheAdapter(),
        redis: new RedisCacheAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION"),
            serde,
        }),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
```

## Usage

### 1. Using the default adapter

```ts
await cacheResolver.use().add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts
await cacheResolver.use("redis").add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

The `CacheResolver` provides chainable methods to override the base configuration per-use:

```ts
await cacheResolver
    .setDefaultTtl(TimeSpan.fromMinutes(5))
    .use("redis")
    .add("user/jose@gmail.com", {
        name: "Jose",
        age: 20,
    });
```

You can also change the type parameter for compile-time type safety:

```ts
await cacheResolver
    .setType<string>()
    .use("redis")
    .add("user/jose@gmail.com", "some-string-value");
```

:::info
Note that the `CacheResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.

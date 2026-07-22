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
import { CacheResolver } from "@daiso-tech/core/cache";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
import { Serde } from "@daiso-tech/core/serde";
import type { ISerde } from "@daiso-tech/core/serde/contracts";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import { TimeSpan } from "@daiso-tech/core/time-span";
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
    .setExecutionContext(context)
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

For further information refer to [`@daiso-tech/core/cache`](https://daiso-tech.github.io/daiso-core/modules/Cache.html) API docs.

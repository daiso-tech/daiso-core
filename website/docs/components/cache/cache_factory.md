---
sidebar_position: 2
sidebar_label: Factory classes
pagination_label: Cache factory classes
tags:
 - Cache
 - Factories
keywords:
 - Cache
 - Factories
---

# CacheFactory

The `CacheFactory` class provides a flexible way to configure and switch between different cache adapters at runtime.

## Initial configuration

To begin using the `CacheFactory`, You will need to register all required adapters during initialization.

```ts
import { CacheFactory } from "@daiso-tech/core/cache";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
import { Serde } from "@daiso-tech/core/serde";
import type { ISerde } from "@daiso-tech/core/serde/contracts";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const cacheFactory = new CacheFactory({
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
await cacheFactory.use().add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts
await cacheFactory.use("redis").add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts
import { z } from "zod";

await eventBusFactory
    .setNamespace(new Namespace("@my-namespace"))
    // You can overide the cache value type by calling setType or setSchema method again
    .setType<string>()
    .setSchema(
        z.object({
            name: z.string(),
            age: z.number(),
        }),
    )
    .use("redis")
    .add("user/jose@gmail.com", {
        name: "Jose",
        age: 20,
    });
```

:::info
Note that the `CacheFactory` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/cache`](https://daiso-tech.github.io/daiso-core/modules/Cache.html) API docs.

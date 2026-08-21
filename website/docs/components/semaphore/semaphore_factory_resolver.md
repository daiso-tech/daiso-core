---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Semaphore resolver classes
tags:
    - Semaphore
    - Resolvers
keywords:
    - Semaphore
    - Resolvers
---

# SemaphoreFactoryResolver

The `SemaphoreFactoryResolver` class provides a flexible way to configure and switch between different semaphore adapters at runtime.

## Initial configuration

To begin using the `ISemaphoreFactoryResolver`, you will need to register all required adapters during initialization.

```ts
import { SemaphoreFactoryResolver } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const semaphoreFactoryResolver = new SemaphoreFactoryResolver({
    adapters: {
        memory: new MemorySemaphoreAdapter(),
        redis: new RedisSemaphoreAdapter(new Redis("YOUR_REDIS_CONNECTION")),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
```

## Usage

### 1. Using the default adapter

```ts
await semaphoreFactoryResolver
    .use()
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts
await semaphoreFactoryResolver
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts
await semaphoreFactoryResolver
    .setNamespace(new Namespace("@my-namespace"))
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
```

:::info
Note that the `SemaphoreFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/semaphore`](https://eridu-tech.github.io/eridu-tech-core/modules/Semaphore.html) API docs.

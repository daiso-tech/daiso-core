---
sidebar_position: 2
sidebar_label: Factory classes
pagination_label: Semaphore factory classes
tags:
 - Semaphore
 - Factories
keywords:
 - Semaphore
 - Factories
---
# SemaphoreProviderFactory

The `SemaphoreProviderFactory` class provides a flexible way to configure and switch between different semaphore adapters at runtime.

## Initial configuration

To begin using the `ISemaphoreProviderFactory`, You will need to register all required adapters during initialization.

```ts
import { SemaphoreProviderFactory } from "@daiso-tech/core/semaphore";
import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const semaphoreProvider = new SemaphoreProviderFactory({
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
await semaphoreProvider
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
await semaphoreProvider
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
await semaphoreProvider
    .setNamespace(new Namespace("@my-namespace"))
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
```

:::info
Note that the `SemaphoreProviderFactory` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/semaphore`](https://daiso-tech.github.io/daiso-core/modules/Semaphore.html) API docs.

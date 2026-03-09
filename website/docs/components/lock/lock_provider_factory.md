---
sidebar_position: 2
sidebar_label: Factory classes
pagination_label: Lock factory classes
tags:
 - Lock
 - Factories
keywords:
 - Lock
 - Factories
---

# LockProviderFactory

The `LockProviderFactory` class provides a flexible way to configure and switch between different lock adapters at runtime.

## Initial configuration

To begin using the `ILockProviderFactory`, You will need to register all required adapters during initialization.

```ts
import { LockProviderFactory } from "@daiso-tech/core/lock";
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import Redis from "ioredis";

const lockProvider = new LockProviderFactory({
    adapters: {
        memory: new MemoryLockAdapter(),
        redis: new RedisLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
```

## Usage

### 1. Using the default adapter

```ts
await lockProvider
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
await lockProvider
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
await lockProvider
    .setNamespace(new Namespace("@my-namespace"))
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
```

:::info
Note that the `LockProviderFactory` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/lock`](https://daiso-tech.github.io/daiso-core/modules/Lock.html) API docs.

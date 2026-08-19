---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Lock resolver classes
tags:
    - Lock
    - Resolver
keywords:
    - Lock
    - Resolver
---

# LockFactoryResolver

The `LockFactoryResolver` class provides a flexible way to configure and switch between different lock adapters at runtime.

## Initial configuration

To begin using the `ILockFactoryResolver`, you will need to register all required adapters during initialization.

```ts
import { LockFactoryResolver } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import Redis from "ioredis";

const lockFactoryResolver = new LockFactoryResolver({
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
await lockFactoryResolver
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
await lockFactoryResolver
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
await lockFactoryResolver
    .setDefaultTtl(TimeSpan.fromMinutes(5))
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
```

:::info
Note that the `LockFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech/modules/Lock.html) API docs.

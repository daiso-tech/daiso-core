---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Shared-lock resolver classes
tags:
    - Shared-lock
    - Resolvers
keywords:
    - Shared-lock
    - Resolvers
---

# SharedLockFactoryResolver

The `SharedLockFactoryResolver` class provides a flexible way to configure and switch between different shared-lock adapters at runtime.

## Initial configuration

To begin using the `ISharedLockFactoryResolver`, you will need to register all required adapters during initialization.

```ts
import { SharedLockFactoryResolver } from "@daiso-tech/core/shared-lock";
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
import Redis from "ioredis";

const sharedLockFactoryResolver = new SharedLockFactoryResolver({
    adapters: {
        memory: new MemorySharedLockAdapter(),
        redis: new RedisSharedLockAdapter(new Redis("YOUR_REDIS_CONNECTION")),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});
```

## Usage

### 1. Using the default adapter

```ts
await sharedLockFactoryResolver
    .use()
    .create("shared-resource")
    .runWriterOrFail(async () => {
        // code to run
    });
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts
await sharedLockFactoryResolver
    .use("redis")
    .create("shared-resource")
    .runWriterOrFail(async () => {
        // code to run
    });
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts
await sharedLockFactoryResolver
    .setNamespace(new Namespace("@my-namespace"))
    .use("redis")
    .create("shared-resource")
    .runWriterOrFail(async () => {
        // code to run
    });
```

:::info
Note that the `SharedLockFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/shared-lock`](https://daiso-tech.github.io/daiso-core/modules/SharedLock.html) API docs.

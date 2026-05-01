---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Event-bus resolver classes
tags:
    - Event-bus
    - Resolvers
keywords:
    - Event-bus
    - Resolvers
---

# EventBusResolver

The `EventBusResolver` class provides a flexible way to configure and switch between different event bus adapters at runtime.

## Initial configuration

To begin using the `EventBusResolver` class, you will need to register all required adapters during initialization.

```ts
import {
    type IEventBusAdapter,
    BaseEvent,
} from "@daiso-tech/core/event-bus/contracts";
import { EventBusResolver } from "@daiso-tech/core/event-bus";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const eventBusResolver = new EventBusResolver({
    adapters: {
        memory: new MemoryEventBusAdapter(),
        redis: new RedisPubSubEventBusAdapter({
            client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
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
await eventBusResolver.use().dispatch("add", { a: 1, b: 2 });
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts
await eventBusResolver.use("redis").dispatch("add", { a: 1, b: 2 });
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts
import { z } from "zod";

await eventBusResolver
    .setNamespace(new Namespace("@my-namespace"))
    // You can overide the event type by calling setEventMapType or setEventMapSchema method again
    .setEventMapType<{
        add: {
            a: 1;
            b: 2;
        };
    }>()
    .setEventMapSchema({
        sub: z.object({
            c: z.number(),
            d: z.number(),
        }),
    })
    .use("redis")
    .dispatch("sub", {
        c: 1,
        d: 2,
    });
```

:::info
Note that the `EventBusResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/event-bus`](https://daiso-tech.github.io/daiso-core/modules/EventBus.html) API docs.

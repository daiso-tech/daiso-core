---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring event-bus adapters
tags:
 - Event-bus
 - Configuring adapters
 - In-memory
 - Redis
 - NoOp
keywords:
 - Event-bus
 - Configuring adapters
 - In-memory
 - Redis
 - NoOp
---

## Configuring EventBus adapters

## MemoryEventBusAdapter

To use the `MemoryEventBusAdapter` you only need to create instance of it.

```ts
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";

const eventBusAdapter = new MemoryEventBusAdapter();
```

You can also provide an `EventEmitter` that will be used for dispatching the events in memory:

```ts
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { EventEmitter } from "node:events";

const eventEmitter = new EventEmitter<any>();
const eventBusAdapter = new MemoryEventBusAdapter(eventEmitter);
```

:::info
`MemoryEventBusAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

## RedisPubSubEventBusAdapter

To use the `RedisPubSubEventBusAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:
2. Provide a string serializer ([`ISerde`](../serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";

const client = new Redis("YOUR_REDIS_CONNECTION_STRING");
const serde = new Serde(new SuperJsonSerdeAdapter());
const eventBusAdapter = new RedisPubSubEventBusAdapter({
    client,
    serde,
});
```

## NoOpEventBusAdapter

The `NoOpEventBusAdapter` is a no-operation implementation, it performs no actions when called.

```ts
import { NoOpEventBusAdapter } from "@daiso-tech/core/event-bus/no-op-event-bus-adapter";

const noEventBusAdapter = new NoOpEventBusAdapter();
```

:::info
The `NoOpEventBusAdapter` is useful when you want to mock out or disable your [`EventBus`](https://daiso-tech.github.io/daiso-core/classes/EventBus.EventBus.html) class.
:::

## Further information

For further information refer to [`@daiso-tech/core/event-bus`](https://daiso-tech.github.io/daiso-core/modules/EventBus.html) API docs.

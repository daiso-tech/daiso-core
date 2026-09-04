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

# Configuring EventBus adapters

## MemoryEventBusAdapter

To use the `MemoryEventBusAdapter` you only need to create instance of it.

```ts file=./configuring_event_bus_adapters-samples/memory_event_bus_adapter.ts
```

You can also provide an `EventEmitter` that will be used for dispatching the events in memory:

```ts file=./configuring_event_bus_adapters-samples/memory_event_bus_adapter_with_emitter.ts
```

:::info
`MemoryEventBusAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

## RedisPubSubEventBusAdapter

To use the `RedisPubSubEventBusAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:
2. Provide a string serializer ([`ISerde`](../serde/serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./configuring_event_bus_adapters-samples/redis_pub_sub_event_bus_adapter.ts
```

## NoOpEventBusAdapter

The `NoOpEventBusAdapter` is a no-operation implementation, it performs no actions when called.

```ts file=./configuring_event_bus_adapters-samples/no_op_event_bus_adapter.ts
```

:::info
The `NoOpEventBusAdapter` is useful when you want to mock out or disable your [`EventBus`](https://eridu-tech.github.io/eridu-tech-core/classes/EventBus.EventBus.html) class.
:::

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.

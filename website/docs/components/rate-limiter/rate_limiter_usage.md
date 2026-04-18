---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Rate-limiter Usage
tags:
 - Rate-limiter
 - Usage
 - Namespace
keywords:
 - Rate-limiter
 - Usage
 - Namespace
---

# Rate-limiter usage

The `@daiso-tech/core/rate-limiter` component provides a way for managing rate-limiter independent of underlying platform or storage.

## Initial configuration

To begin using the `RateLimiterFactory` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";

const rateLimiterFactory = new RateLimiterFactory({
    // You can provide default settings
    // You can choose the adapter to use
    adapter: new DatabaseRateLimiterAdapter({
        adapter: new MemoryRateLimiterStorageAdapter()
    }),
});
```

:::info
Here is a complete list of settings for the [`RateLimiterFactory`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.RateLimiterFactorySettingsBase.html) class.
:::

## Rate-limiter basics

### Creating a rate-limiter

```ts
const rateLimiter = rateLimiterFactory.create("resource");
```

### Using the rate-limiter

```ts
// The function will only be called when the rate-limiter is in closed state or half open state.
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
})
```

:::info
Note the method throws an error when the rate-limiter is in open state or isolated state.
:::

:::info
You can provide synchronous and asynchronous [`Invokable<[], TValue | Promise<TValue>>`](../../utilities/invokable.md) as values for `runOrFail` method.
:::

### Applying rate-limiter on only erros

The rate-limiter defaults to counting all attempts. You can optionally configure it to track only failed requests.

```ts
class ErrorA extends Error {}

const rateLimiter = rateLimiterFactory.create("resource", {
    onlyError: true,
});
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
})
```

### Applying rate-limiter on certiain errors

```ts
class ErrorA extends Error {}

const rateLimiter = rateLimiterFactory.create("resource", {
    onlyError: true,
    // Error policy will only work "onlyError" is set to true
    errorPolicy: ErrorA
});
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
})
```

### Reseting the rate-limiter

You can reset rate-limiter state to the closed state manually.

```ts
await rateLimiter.reset();
```

### Checking rate-limiter state

You can get the rate-limiter state by using the `getState` method, it returns [`RateLimiterState`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.RateLimiterState.html).

```ts
import { RATE_LIMITER_STATE } from "@daiso-tech/core/rate-limiter/contracts";

const state = await rateLimiter.getState();

if (state === RATE_LIMITER_STATE.EXPIRED) {
    console.log("The rate limiter key doesnt exists")
}
if (state === RATE_LIMITER_STATE.ALLOWED) {
    console.log("The rate limiter is allowing calls")
}
if (state === RATE_LIMITER_STATE.BLOCKED) {
    console.log("The rate limiter is blocking calls")
}
```

### Rate-limiter instance variables

The `RateLimiter` class exposes instance variables such as:

```ts
const rateLimiter = rateLimiterFactory.create("resource");

// Will return the key of the rate-limiter which is "resource"
console.log(rateLimiter.key.toString());
```

:::info
The `key` field is an object that implements [`IKey`](../namespace.md) contract.
:::

## Patterns

### Namespacing

You can use the `Namespace` class to group related rate-limiters without conflicts. Since namespacing is not used be default, you need to pass an obeject that implements `INamespace` object.

:::info
For further information about namespacing refer to [`@daiso-tech/core/namespace`](../namespace.md) documentation.
:::

```ts
import { Namespace } from "@daiso-tech/core/namespace";
import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");

const rateLimiterFactoryA = new RateLimiterFactory({
    namespace: new Namespace("@rate-limiter-a"),
    adapter: new RedisRateLimiterAdapter({ database }),
});
const rateLimiterFactoryB = new RateLimiterFactory({
    namespace: new Namespace("@rate-limiter-b"),
    adapter: new RedisRateLimiterAdapter({ database }),
});

const rateLimiterA = await rateLimiterFactoryA.create("key", { ttl: null });
const rateLimiterB = await rateLimiterFactoryB.create("key", { ttl: null });

await rateLimiterA.isolate();

// Will log ISOLATED
console.log(await rateLimiterA.getState())

// Will log CLOSED
console.log(await rateLimiterB.getState())
```

### Serialization and deserialization of rate-limiters

rate-limiters can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the rate-limiter on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a rate-limiter you need pass an object that implements [`ISerderRegister`](../serde.md) contract like the [`Serde`](../serde.md) class to `RateLimiterFactory`. 

Manually serializing and deserializing the rate-limiter:

```ts
import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const rateLimiterFactory = new RateLimiterFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisRateLimiterAdapter({ database: redisClient }),
});

const rateLimiter = rateLimiterFactory.create("resource");
const serializedRateLimiter = serde.serialize(rateLimiter);
const deserializedRateLimiter = serde.deserialize(rateLimiter);
```

:::danger
When serializing or deserializing a rate-limiter, you must use the same `Serde` instances that were provided to the `RateLimiterFactory`. This is required because the `RateLimiterFactory` injects custom serialization logic for `IRateLimiter` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the rate-limiter manually.

```ts
import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
import type { IRateLimiter } from "@daiso-tech/core/rate-limiter/contracts";
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-rate-limiter-over-network": {
        rateLimiter: IRateLimiter;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const rateLimiterFactory = new RateLimiterFactory({
    serde,
    adapter: new RedisRateLimiterAdapter({ databsae: redis }),
    eventBus,
});
const rateLimiter = rateLimiterFactory.create("resource");

// We are sending the rateLimiter over the network to other servers.
await eventBus.dispatch("sending-rate-limiter-over-network", {
    rateLimiter,
});

// The other servers will recieve the serialized rateLimiter and automattically deserialize it.
await eventBus.addListener("sending-rate-limiter-over-network", ({ rateLimiter }) => {
    // The rateLimiter is deserialized and can be used
    console.log("RATE_LIMITER:", rateLimiter);
});
```

### Rate-limiter events

You can listen to different [rate-limiter events](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) that are triggered by the `RateLimiter` instance.
Refer to the [`EventBus`](../event_bus/event_bus_usage.md) documentation to learn how to use events. Since no events are dispatched by default, you need to pass an object that implements `IEventBus` contract.

```ts
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { RateLimiterFactory, RATE_LIMITER_EVENTS } from "@daiso-tech/core/rate-limiter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";

const rateLimiterFactory = new RateLimiterFactory({
    adapter: new DatabaseRateLimiterAdapter({ 
        adapter: new MemoryRateLimiterStorageAdapter()
    }),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter(),
    }),
});

await rateLimiterFactory.events.addListener(RATE_LIMITER_EVENTS.BLOCKED, (_event) => {
    console.log("Got blocked:", event);
});

await rateLimiterFactory.create("a").isolate();
```

:::warning
If multiple rate-limiter adapters (e.g., `RedisRateLimiterAdapter` and `DatabaseRateLimiterAdapter`) are used at the same time, you need to isolate their events by assigning separate namespaces. This prevents listeners from unintentionally capturing events across adapters.

```ts
import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";
import { Namespace } from "@daiso-tech/core/namespace";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisPubSubEventBusAdapter = new RedisPubSubEventBusAdapter({
    client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
    serde,
});

const memoryRateLimiterFactory = new RateLimiterFactory({
    adapter: new DatabaseRateLimiterAdapter({ 
        adapter: new MemoryRateLimiterStorageAdapter()
    }),
    eventBus: new EventBus({
        // We assign distinct namespaces to DatabaseRateLimiterAdapter and RedisRateLimiterAdapter to isolate their events.
        namespace: new Namespace(["memory", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});

const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    serde,
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
const redisRateLimiterFactory = new RateLimiterFactory({
    adapter: redisRateLimiterAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to DatabaseRateLimiterAdapter and RedisRateLimiterAdapter to isolate their events.
        namespace: new Namespace(["redis", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});
```

:::

### Separating creating, listening to and using rate-limiters

The library includes 3 additional contracts:

- [`IRateLimiter`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiter.html) - Allows only for manipulating of the lock.

- [`IRateLimiterFactoryBase`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiterFactoryBase.html) - Allows only for creation of locks.

- [`IRateLimiterListenable`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.IRateLimiterListenable.html) - Allows only to listening to lock events.

This seperation makes it easy to visually distinguish the 3 contracts, making it immediately obvious that they serve different purposes.

```ts
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import {
    type IRateLimiter,
    type IRateLimiterFactoryBase,
    type IRateLimiterListenable,
    RATE_LIMITER_EVENTS,
} from "@daiso-tech/core/rate-limiter/contracts";

async function rateLimiterFunc(rateLimiter: IRateLimiter): Promise<void> {
    await rateLimiter.runOrFail(async () => {
        await doWork();
    });
}

async function rateLimiterFactoryFunc(rateLimiterFactory: IRateLimiterFactoryBase): Promise<void> {
    // You cannot access the listener methods
    // You will get typescript error if you try

    const rateLimiter = rateLimiterFactory.create("resource");
    await rateLimiterFunc(rateLimiter);
}

async function rateLimiterListenableFunc(
    rateLimiterListenable: IRateLimiterListenable,
): Promise<void> {
    // You cannot access the rateLimiterFactory methods
    // You will get typescript error if you try

    await rateLimiterListenable.addListener(RATE_LIMITER_EVENTS.BLOCKED, (event) => {
        console.log("Blocked:", event);
    });
}

const rateLimiterFactory = new RateLimiterFactory({
    adapter: new DatabaseRateLimiterAdapter({
        adapter: new MemoryRateLimiterStorageAdapter(),
    }),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter()
    })
})
await rateLimiterListenableFunc(rateLimiterFactory.events);
await rateLimiterFactoryFunc(rateLimiterFactory);
```


## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.

---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Circuit-breaker Usage
tags:
 - Circuit-breaker
 - Usage
 - Namespace
keywords:
 - Circuit-breaker
 - Usage
 - Namespace
---

# Circuit-breaker usage

The `@daiso-tech/core/circuit-breaker` component provides a way for managing circuit-breaker independent of underlying platform or storage.

## Initial configuration

To begin using the `CircuitBreakerFactory` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "@daiso-tech/core/circuit-breaker";

const circuitBreakerFactory = new CircuitBreakerFactory({
    // You can provide default settings
    // You can choose the adapter to use
    adapter: new DatabaseCircuitBreakerAdapter({
        adapter: new MemoryCircuitBreakerStorageAdapter()
    }),
});
```

:::info
Here is a complete list of settings for the [`CircuitBreakerFactory`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.CircuitBreakerFactorySettingsBase.html) class. 
:::

## Circuit-breaker basics

### Creating a circuit-breaker

```ts
const circuitBreaker = circuitBreakerFactory.create("resource");
```

### Using the circuit-breaker

```ts
// The function will only be called when the circuit-breaker is in closed state or half open state.
await circuitBreaker.runOrFail(async () => {
    // Call the external service
})
```

:::info
Note the method throws an error when the circuit-breaker is in open state or isolated state.
:::

:::info
You can provide synchronous and asynchronous [`Invokable<[], Promiseable<TValue>>`](../../utilities/invokable.md) as values for `runOrFail` method.
:::

### Applying circuit-breaker on certiain errors

```ts
class ErrorA extends Error {}

const circuitBreaker = circuitBreakerFactory.create("resource", {
    errorPolicy: ErrorA
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
})
```

### Setting circuit-breaker triggers

By default the the circuit-breaker will treat errors and slow calls as failures. You can explicitly set ths option.

The `CIRCUIT_BREAKER_TRIGGER.BOTH` will treat error and slow calls as failures.

```ts
import { CIRCUIT_BREAKER_TRIGGER } from "@daiso-tech/core/circuit-breaker/contracts";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: CIRCUIT_BREAKER_TRIGGER.BOTH
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
})
```

The `CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR` will treat only errors as failures.

```ts
import { CIRCUIT_BREAKER_TRIGGER } from "@daiso-tech/core/circuit-breaker/contracts";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
})
```

The `CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL` will treat slow calls as failures.

```ts
import { CIRCUIT_BREAKER_TRIGGER } from "@daiso-tech/core/circuit-breaker/contracts";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
})
```

### Setting the slow call threshold

You can set custom slow call threshold that will be used when treating slow calls as failures.

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: TimeSpan.fromSeconds(1)
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
})
```

### Reseting the circuit-breaker

You can reset circuit-breaker state to the closed state manually.

```ts
await circuitBreaker.reset();
```

### Isolating the circuit-breaker

You can manually hold circuit-breaker in open state until reseted.

```ts
await circuitBreaker.isolate();
```

### Checking circuit-breaker state

You can get the circuit-breaker state by using the `getState` method, it returns [`CircuitBreakerState`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.CircuitBreakerState.html).

```ts
import { CIRCUIT_BREAKER_STATE } from "@daiso-tech/core/circuit-breaker/contracts";

const state = await circuitBreaker.getState();

if (state === CIRCUIT_BREAKER_STATE.CLOSED) {
    console.log("The service is up and running without problems")
}
if (state === CIRCUIT_BREAKER_STATE.OPEN) {
    console.log("The service is down or degraded and you need to wait")
}
if (state === CIRCUIT_BREAKER_STATE.HALF_OPEN) {
    console.log("Proping to check if the server is up and running or down / degraded")
}
if (state === CIRCUIT_BREAKER_STATE.ISOLATED) {
    console.log("The service is held in open state manually until reseted")
}
```

### Circuit-breaker instance variables

The `CircuitBreaker` class exposes instance variables such as:

```ts
const circuitBreaker = circuitBreakerFactory.create("resource");

// Will return the key of the circuit-breaker which is "resource"
console.log(circuitBreaker.key.toString());
```

:::info
The `key` field is an object that implements [`IKey`](../namespace.md) contract.
:::

## Patterns

### Namespacing

You can use the `Namespace` class to group related circuit-breakers without conflicts. Since namespacing is not used be default, you need to pass an obeject that implements `INamespace` object.

:::info
For further information about namespacing refer to [`@daiso-tech/core/namespace`](../namespace.md) documentation.
:::

```ts
import { Namespace } from "@daiso-tech/core/namespace";
import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "@daiso-tech/core/circuit-breaker";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");

const circuitBreakerFactoryA = new CircuitBreakerFactory({
    namespace: new Namespace("@circuit-breaker-a"),
    adapter: new RedisCircuitBreakerAdapter({ database }),
});
const circuitBreakerFactoryB = new CircuitBreakerFactory({
    namespace: new Namespace("@circuit-breaker-b"),
    adapter: new RedisCircuitBreakerAdapter({ database }),
});

const circuitBreakerA = await circuitBreakerFactoryA.create("key", { ttl: null });
const circuitBreakerB = await circuitBreakerFactoryB.create("key", { ttl: null });

await circuitBreakerA.isolate();

// Will log ISOLATED
console.log(await circuitBreakerA.getState())

// Will log CLOSED
console.log(await circuitBreakerB.getState())
```

### Serialization and deserialization of circuit-breakers

circuit-breakers can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the circuit-breaker on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a circuit-breaker you need pass an object that implements [`ISerderRegister`](../serde.md) contract like the [`Serde`](../serde.md) class to `CircuitBreakerFactory`. 

Manually serializing and deserializing the circuit-breaker:

```ts
import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "@daiso-tech/core/circuit-breaker";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const circuitBreakerFactory = new CircuitBreakerFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisCircuitBreakerAdapter({ database: redisClient }),
});

const circuitBreaker = circuitBreakerFactory.create("resource");
const serializedCircuitBreaker = serde.serialize(circuitBreaker);
const deserializedCircuitBreaker = serde.deserialize(circuitBreaker);
```

:::danger
When serializing or deserializing a circuit-breaker, you must use the same `Serde` instances that were provided to the `CircuitBreakerFactory`. This is required because the `CircuitBreakerFactory` injects custom serialization logic for `ICircuitBreaker` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the circuit-breaker manually.

```ts
import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
import type { ICircuitBreaker } from "@daiso-tech/core/circuit-breaker/contracts";
import { CircuitBreakerFactory } from "@daiso-tech/core/circuit-breaker";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-circuit-breaker-over-network": {
        circuitBreaker: ICircuitBreaker;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const circuitBreakerFactory = new CircuitBreakerFactory({
    serde,
    adapter: new RedisCircuitBreakerAdapter({ databsae: redis }),
    eventBus,
});
const circuitBreaker = circuitBreakerFactory.create("resource");

// We are sending the circuitBreaker over the network to other servers.
await eventBus.dispatch("sending-circuit-breaker-over-network", {
    circuitBreaker,
});

// The other servers will recieve the serialized circuitBreaker and automattically deserialize it.
await eventBus.addListener("sending-circuit-breaker-over-network", ({ circuitBreaker }) => {
    // The circuitBreaker is deserialized and can be used
    console.log("CIRCUIT_BREAKER:", circuitBreaker);
});
```


### Circuit-breaker events

You can listen to different [circuit-breaker events](https://daiso-tech.github.io/daiso-core/modules/CircuitBreaker.html) that are triggered by the `CircuitBreaker` instance.
Refer to the [`EventBus`](../event_bus/event_bus_usage.md) documentation to learn how to use events. Since no events are dispatched by default, you need to pass an object that implements `IEventBus` contract.

```ts
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
import { CircuitBreakerFactory, CIRCUIT_BREAKER_EVENTS } from "@daiso-tech/core/circuit-breaker";
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";

const circuitBreakerFactory = new CircuitBreakerFactory({
    adapter: new DatabaseCircuitBreakerAdapter({ 
        adapter: new MemoryCircuitBreakerStorageAdapter()
    }),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter(),
    }),
});

await circuitBreakerFactory.events.addListener(CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED, (event) => {
    console.log(`State transitioned occurred. from ${event.from} to ${event.to}`);
});

await circuitBreakerFactory.create("a").isolate();
```

:::warning
If multiple circuit-breaker adapters (e.g., `RedisCircuitBreakerAdapter` and `DatabaseCircuitBreakerAdapter`) are used at the same time, you need to isolate their events by assigning separate namespaces. This prevents listeners from unintentionally capturing events across adapters.

```ts
import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
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

const memoryCircuitBreakerFactory = new CircuitBreakerFactory({
    adapter: new DatabaseCircuitBreakerAdapter({ 
        adapter: new MemoryCircuitBreakerStorageAdapter()
    }),
    eventBus: new EventBus({
        // We assign distinct namespaces to DatabaseCircuitBreakerAdapter and RedisCircuitBreakerAdapter to isolate their events.
        namespace: new Namespace(["memory", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});

const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    serde,
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
const redisCircuitBreakerFactory = new CircuitBreakerFactory({
    adapter: redisCircuitBreakerAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to DatabaseCircuitBreakerAdapter and RedisCircuitBreakerAdapter to isolate their events.
        namespace: new Namespace(["redis", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});
```

:::

### Separating creating, listening to and using circuit-breakers

The library includes 3 additional contracts:

- [`ICircuitBreaker`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.ICircuitBreaker.html) - Allows only for manipulating of the lock.

- [`ICircuitBreakerFactoryBase`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.ICircuitBreakerFactoryBase.html) - Allows only for creation of locks.

- [`ICircuitBreakerListenable`](https://daiso-tech.github.io/daiso-core/types/CircuitBreaker.ICircuitBreakerListenable.html) - Allows only to listening to lock events.

This seperation makes it easy to visually distinguish the 3 contracts, making it immediately obvious that they serve different purposes.

```ts
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { CircuitBreakerFactory } from "@daiso-tech/core/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
import {
    type ICircuitBreaker,
    type ICircuitBreakerFactoryBase,
    type ICircuitBreakerListenable,
    CIRCUIT_BREAKER_EVENTS,
} from "@daiso-tech/core/circuit-breaker/contracts";

async function circuitBreakerFunc(circuitBreaker: ICircuitBreaker): Promise<void> {
    await circuitBreaker.runOrFail(async () => {
        await doWork();
    });
}

async function circuitBreakerFactoryFunc(circuitBreakerFactory: ICircuitBreakerFactoryBase): Promise<void> {
    // You cannot access the listener methods
    // You will get typescript error if you try

    const circuitBreaker = circuitBreakerFactory.create("resource");
    await circuitBreakerFunc(circuitBreaker);
}

async function circuitBreakerListenableFunc(
    circuitBreakerListenable: ICircuitBreakerListenable,
): Promise<void> {
    // You cannot access the circuitBreakerFactory methods
    // You will get typescript error if you try

    await circuitBreakerListenable.addListener(CIRCUIT_BREAKER_EVENTS.STATE_TRANSITIONED, (event) => {
        console.log(`State transitioned occurred. from ${event.from} to ${event.to}`);
    });
}

const circuitBreakerFactory = new CircuitBreakerFactory({
    adapter: new DatabaseCircuitBreakerAdapter({
        adapter: new MemoryCircuitBreakerStorageAdapter(),
    }),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter()
    })
})
await circuitBreakerListenableFunc(circuitBreakerFactory.events);
await circuitBreakerFactoryFunc(circuitBreakerFactory);
```


## Further information

For further information refer to [`@daiso-tech/core/circuit-breaker`](https://daiso-tech.github.io/daiso-core/modules/CircuitBreaker.html) API docs.

---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Semaphore usage
tags:
 - Semaphore
 - Usage
 - Namespace
keywords:
 - Semaphore
 - Usage
 - Namespace
---

# Semaphore usage

The `@daiso-tech/core/semaphore` component provides a way for managing semaphores independent of underlying platform or storage.

## Initial configuration

To begin using the `SemaphoreFactory` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
import { SemaphoreFactory } from "@daiso-tech/core/semaphore";


const semaphoreFactory = new SemaphoreFactory({
    // You can provide default TTL value
    // If you set it to null it means semaphores will not expire and most be released manually by default.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemorySemaphoreAdapter(),
});
```

:::info
Here is a complete list of settings for the [`SemaphoreFactory`](https://daiso-tech.github.io/daiso-core/types/Semaphore.SemaphoreFactorySettingsBase.html) class.
:::

## Semaphore basics

### Creating a semaphore
```ts
const semaphore = semaphoreFactory.create("shared-resource", {
    // You need to define a limit
    limit: 2
});
```

### Acquiring and releasing the semaphore

```ts
// 1 slot will be acquired
if (await semaphore.acquire()) {
    console.log("Acquired");
    try {
        // The concurrent section
    } finally {
        await semaphore.release();
    }
}
else {
    console.log("Unable to acquire");
}

// 2 slots will be acquired
if (await semaphore.acquire()) {
    console.log("Acquired");
    try {
        // The concurrent section
    } finally {
        await semaphore.release();
    }
}
else {
    console.log("Unable to acquire");
}

// Will log false because the limit is reached
console.log(await semaphore.acquire());
```

Alternatively you could write it as follows:

```ts

// 1 slot will be acquired
try {
    console.log("Acquired");
    // This method will throw if the semaphore limit is reached.
    await semaphore.acquireOrFail();
    // The critical section
}
catch {
    console.log("Unable to acquire");
}
finally {
    await semaphore.release();
}

// 2 slots will be acquired
try {
    console.log("Acquired");
    // This method will throw if the semaphore limit is reached.
    await semaphore.acquireOrFail();
    // The critical section
}
catch {
    console.log("Unable to acquire");
}
finally {
    await semaphore.release();
}

// Will throw because the limit is reached
await semaphore.acquireOrFail();
```

:::danger
You need always to wrap the concurrent section with `try-finally` so the semaphore get released when error occurs.
:::

:::danger
Note `Semaphore` class uses `Task` instead of a regular `Promise`. This means you must either await the `Task` or call its `detach` method to run it.
Refer to the [`@daiso-tech/core/task`](../task.md) documentation for further information.
:::

### Semaphore with custom TTL

You can provide a custom TTL for the semaphore.

```ts
const semaphore = semaphoreFactory.create("shared-resource", {
    // Default TTL is 5min if not overrided
    // If you set it to null it means semaphore will not expire and most be released manually.
    ttl: TimeSpan.fromSeconds(30),
    limit: 2,
});
```

### Checking semaphore state

You can get the semaphore state by using the `getState` method, it returns [`ISemaphoreState`](https://daiso-tech.github.io/daiso-core/types/Semaphore.ISemaphoreState.html).

```ts
import { SEMAPHORE_STATE } from "@daiso-tech/core/semaphore/contracts";

const semaphore = semaphoreFactory.create("shared-resource", {
    limit: 2,
});
const state = await semaphore.getState();

if (state.type === SEMAPHORE_STATE.EXPIRED) {
    console.log("The semaphore doesnt exists");
}

if (state.type === SEMAPHORE_STATE.LIMIT_REACHED) {
    console.log("The limit have been reached and all slots are unavailable");
}

if (state.type === SEMAPHORE_STATE.ACQUIRED) {
    console.log("The semaphore is acquired");
}

if (state.type === SEMAPHORE_STATE.UNACQUIRED) {
    console.log("There are avilable slots but the semaphore is not acquired");
}
```

## Patterns

### Acquire blocking

You can acquire a semaphore at regular intervals until either successful or a specified timeout is reached:

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

const hasAcquired = await semaphore.acquireBlocking({
    // Time to wait 1 minute
    time: TimeSpan.fromMinutes(1),
    // Intervall to try acquire a semaphore
    interval: TimeSpan.fromSeconds(1),
});
if (hasAcquired) {
    try {
        await doWork();
    } finally {
        await semaphore.release();
    }
}
// Will be logged after 1min
console.log("END");
```

:::warning
Note using `acquireBlocking`, `acquireBlockingOrFail` or `runBlockingOrFail` in a HTTP request handler is discouraged because it blocks the HTTP request handler causing the handler wait until the semaphore becomes available or the timeout is reached. This will delay HTTP request handler to generate response and will make frontend app slow because of HTTP request handler.
:::


### Refreshing semaphores

The semaphore can be refreshed by the current owner before it expires. This is particularly useful for long-running tasks,
instead of setting an excessively long TTL initially, you can start with a shorter one and use the `refresh` method to set the TTL of the semaphore:

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
    ttl: TimeSpan.fromMinutes(1),
});

const hasAcquired = await semaphore.acquire();
if (hasAcquired) {
    try {
        while (true) {
            await semaphore.refresh(TimeSpan.fromMinutes(1));
            const hasFinished = await doWork();
            if (hasFinished) {
                break;
            }
            await Task.delay(TimeSpan.fromSeconds(1));
        }
    } finally {
        await semaphore.release();
    }
}
```
:::warning
Note: A semaphore must have an expiration (a `ttl` value) to be refreshed. You cannot refresh a semaphore that was created without an expiration (with `ttl: null`)

```ts
// Create a semaphore with no expiration (non-refreshable)
const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
    ttl: null,
});

// A refresh attempt on this semaphore will fail
const hasRefreshed = await semaphore.refresh();

// This will log 'false' because the semaphore cannot be refreshed
console.log(hasRefreshed);
```
:::

### Additional methods

The `acquireBlockingOrFail` method is the same as `acquireBlocking` method but it throws an error when not enable to acquire the semaphore:

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

await semaphore.acquireBlockingOrFail({
    // You can provide the same configuration as in acquireBlocking method
});
```

The `releaseOrFail` method is the same `release` method but it throws an error when not enable to release the semaphore:

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

await semaphore.releaseOrFail();
```

You can force release all the semaphore slots:

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

await semaphore.forceReleaseAll();
```

The `refreshOrFail` method is the same `refresh` method but it throws an error when not enable to refresh the semaphore:

```ts
const semaphore = semaphoreFactory.create("resource");

await semaphore.refreshOrFail();
```

The `runOrFail` method automatically manages semaphore acquisition and release around function execution.
It calls `acquireOrFail` before invoking the function and calls `release` in a finally block, ensuring the semaphore is always freed, even if an error occurs during execution.

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

await semaphore.runOrFail(async () => {
    await doWork();
});
```

:::info
Note the method throws an error when the semaphore cannot be acquired.
:::

The `runBlockingOrFail` method automatically manages semaphore acquisition and release around function execution.
It calls `acquireBlockingOrFail` before invoking the function and calls `release` in a finally block, ensuring the semaphore is always freed, even if an error occurs during execution.

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

await semaphore.runBlockingOrFail(
    async () => {
        await doWork();
    },
    {
        // You can provide the same configuration as in acquireBlocking method
    },
);
```

:::info
Note the method throws an error when a semaphore cannot be acquired.
:::

:::info
You can provide [`Task<TValue>`](../task.md), synchronous and asynchronous [`Invokable<[], TValue>`](../../utilities/invokable.md) as values for `runOrFail`, and `runBlockingOrFail` methods.
:::

### Semaphore instance variables

The `Semaphore` class exposes instance variables such as:

```ts
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

// Will return the key of the semaphore which is "resource"
console.log(semaphore.key.toString());

// Will return the id of the semaphore
console.log(semaphore.id);

// Will return the ttl of the semaphore
console.log(semaphore.ttl);
```

:::info
The `key` field is an object that implements [`IKey`](../namespace.md) contract.
:::

### Semaphore slot id

By default the slot id is autogenerated but it can also manually defined.

```ts
const semaphore = semaphoreFactory.create("semaphore", {
    slotId: "my-slot-id",
});

const hasAcquire = await semaphore.acquire();
if (hasAcquired) {
    console.log("Shared resource");
    await semaphore.release();
}
```

:::info
Manually defining slot id is primarily useful for debugging or implementing manual resource controll by the end user.
:::

:::warning
In most cases, setting a slot id is unnecessary.
:::

### Namespacing

You can use the `Namespace` class to group related semaphores without conflicts. Since namespacing is not used be default, you need to pass an obeject that implements `INamespace` object.

:::info
For further information about namespacing refer to [`@daiso-tech/core/namespace`](../namespace.md) documentation.
:::

```ts
import { Namespace } from "@daiso-tech/core/namespace";
import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
import { SemaphoreFactory } from "@daiso-tech/core/semaphore";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const serde = new Serde(new SuperJsonSerdeAdapter());

const semaphoreFactoryA = new SemaphoreFactory({
    namespace: new Namespace("@semaphore-a"),
    adapter: new RedisSemaphoreAdapter(database),
    serde,
});
const semaphoreFactoryB = new SemaphoreFactory({
    namespace: new Namespace("@semaphore-b"),
    adapter: new RedisSemaphoreAdapter(database),
    serde,
});

const semaphoreA = semaphoreFactoryA.create("key", {
    ttl: null,
    limit: 1
});
const semaphoreB = semaphoreFactoryB.create("key", {
    ttl: null,
    limit: 1
});

const hasAquiredA = await semaphoreA.acquire();
// Will log true
console.log(hasAquiredA);

const hasAquiredB = await semaphoreB.acquire();
// Will log true
console.log(hasAquiredB);

const hasReleasedB = await semaphoreB.release();
// Will log true
console.log(hasReleasedB);

// Will log { type: "ACQUIRED", remainingTime: null }
console.log(await semaphoreA.getState());

// Will log { type: "EXPIRED" }
console.log(await semaphoreB.getState());
```

### Retrying acquiring semaphore

To retry acquiring semaphore you can use the [`retry`](../resilience.md) middleware with [`Task.pipe`](../task.md) method.

Retrying acquiring semaphore with `acquireOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { FailedAcquireSemaphoreError } from "@daiso-tech/core/semaphore/contracts";

const semaphore = semaphoreFactory.create("semaphore", {
    limit: 2
});

try {
    await semaphore.acquireOrFail().pipe(
        retry({
            maxAttempts: 4,
            errorPolicy: FailedAcquireSemaphoreError,
        }),
    );
    // The critical section
} finally {
    await semaphore.release();
}
```

Retrying acquiring semaphore with `acquire` method:

```ts
import { retry } from "@daiso-tech/core/resilience";

const semaphore = semaphoreFactory.create("semaphore", {
    limit: 2
});

const hasAquired = await semaphore.acquire().pipe(
    retry({
        maxAttempts: 4,
        errorPolicy: {
            treatFalseAsError: true,
        },
    }),
);
if (hasAquired) {
    try {
        // The critical section
    } finally {
        await semaphore.release();
    }
}
```

Retrying acquiring semaphore with `runOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { FailedAcquireSemaphoreError } from "@daiso-tech/core/semaphore/contracts";

const semaphore = semaphoreFactory.create("semaphore", {
    limit: 2
});

await semaphore
    .runOrFail(async () => {
        // The critical section
    })
    .pipe(
        retry({
            maxAttempts: 4,
            errorPolicy: FailedAcquireSemaphoreError,
        }),
    );
```

### Serialization and deserialization of semaphore

Semaphores can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the semaphore on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a semaphore you need pass an object that implements [`ISerderRegister`](../serde.md) contract like the [`Serde`](../serde.md) class to `SemaphoreFactory`. 

Manually serializing and deserializing the semaphore:

```ts
import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
import { SemaphoreFactory } from "@daiso-tech/core/semaphore";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const semaphoreFactory = new SemaphoreFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisSemaphoreAdapter(redisClient),
});

const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});
const serializedSemaphore = serde.serialize(semaphore);
const deserializedSemaphore = serde.deserialize(semaphore);
```

:::danger
When serializing or deserializing a semaphore, you must use the same `Serde` instances that were provided to the `SemaphoreFactory`. This is required because the `SemaphoreFactory` injects custom serialization logic for `ISemaphore` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the semaphore manually.

```ts
import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
import type { ISemaphore } from "@daiso-tech/core/semaphore/contracts";
import { SemaphoreFactory } from "@daiso-tech/core/semaphore";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-semaphore-over-network": {
        semaphore: ISemaphore;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const semaphoreFactory = new SemaphoreFactory({
    serde,
    adapter: new RedisSemaphoreAdapter(redis),
    eventBus,
});
const semaphore = semaphoreFactory.create("resource", {
    limit: 2
});

// We are sending the semaphore over the network to other servers.
await eventBus.dispatch("sending-semaphore-over-network", {
    semaphore,
});

// The other servers will recieve the serialized semaphore and automattically deserialize it.
await eventBus.addListener("sending-semaphore-over-network", ({ semaphore }) => {
    // The semaphore is deserialized and can be used
    console.log("SEMAPHORE:", semaphore);
});
```

### Semaphore events

You can listen to different [semaphore events](https://daiso-tech.github.io/daiso-core/modules/Semaphore.html) that are triggered by the `Semaphore` instance.
Refer to the [`EventBus`](../event_bus/event_bus_usage.md) documentation to learn how to use events. Since no events are dispatched by default, you need to pass an object that implements `IEventBus` contract.

```ts
import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
import { SemaphoreFactory, SEMAPHORE_EVENTS } from "@daiso-tech/core/semaphore";
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";

const semaphoreFactory = new SemaphoreFactory({
    adapter: new MemorySemaphoreAdapter(),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter(),
    }),
});

await semaphoreFactory.events.addListener(SEMAPHORE_EVENTS.ACQUIRED, () => {
    console.log("Lock acquired");
});

await semaphoreFactory.create("a").acquire();
```

:::warning
If multiple semaphore adapters (e.g., `RedisSemaphoreAdapter` and `MemorySemaphoreAdapter`) are used at the same time, you need to isolate their events by assigning separate namespaces. This prevents listeners from unintentionally capturing events across adapters.

```ts
import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
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

const memorySemaphoreAdapter = new MemorySemaphoreAdapter();
const memorySemaphoreFactory = new SemaphoreFactory({
    adapter: memorySemaphoreAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to MemorySemaphoreAdapter and RedisSemaphoreAdapter to isolate their events.
        namespace: new Namespace(["memory", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});

const redisSemaphoreAdapter = new RedisSemaphoreAdapter({
    serde,
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
const redisSemaphoreFactory = new SemaphoreFactory({
    adapter: redisSemaphoreAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to MemorySemaphoreAdapter and RedisSemaphoreAdapter to isolate their events.
        namespace: new Namespace(["redis", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});
```

:::

### Separating creating, listening to and manipulating semaphore

The library includes 3 additional contracts:

- [`ISemaphore`](https://daiso-tech.github.io/daiso-core/types/Semaphore.ISemaphore.html) - Allows only for manipulating of the semaphore.

- [`ISemaphoreFactoryBase`](https://daiso-tech.github.io/daiso-core/types/Semaphore.ISemaphoreFactoryBase.html) - Allows only for creation of semaphores.

- [`ISemaphoreListenable`](https://daiso-tech.github.io/daiso-core/types/Semaphore.ISemaphoreListenable.html) - Allows only to listening to semaphore events.

This seperation makes it easy to visually distinguish the 3 contracts, making it immediately obvious that they serve different purposes.

```ts
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { SemaphoreFactory } from "@daiso-tech/core/semaphore";
import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";
import {
    type ISemaphore,
    type ISemaphoreFactoryBase,
    type ISemaphoreListenable,
    SEMAPHORE_EVENTS,
} from "@daiso-tech/core/semaphore/contracts";

async function semaphoreFunc(semaphore: ISemaphore): Promise<void> {
    await semaphore.runOrFail(async () => {
        await doWork();
    });
}

async function semaphoreFactoryFunc(semaphoreFactory: ISemaphoreFactoryBase): Promise<void> {
    // You cannot access the listener methods
    // You will get typescript error if you try

    const semaphore = semaphoreFactory.create("resource", {
        limit: 2
    });
    await semaphoreFunc(semaphore);
}

async function semaphoreListenableFunc(
    semaphoreListenable: ISemaphoreListenable,
): Promise<void> {
    // You cannot access the semaphoreFactory methods
    // You will get typescript error if you try

    await semaphoreListenable.addListener(SEMAPHORE_EVENTS.ACQUIRED, (event) => {
        console.log("ACQUIRED:", event);
    });
    await semaphoreListenable.addListener(SEMAPHORE_EVENTS.RELEASED, (event) => {
        console.log("RELEASED:", event);
    });
}

const semaphoreFactory = new SemaphoreFactory({
    adapter: new MemorySemaphoreAdapter(),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter(),
    })
})
await semaphoreListenableFunc(semaphoreFactory.events);
await semaphoreFactoryFunc(semaphoreFactory);
```

## Further information

For further information refer to [`@daiso-tech/core/semaphore`](https://daiso-tech.github.io/daiso-core/modules/Semaphore.html) API docs.

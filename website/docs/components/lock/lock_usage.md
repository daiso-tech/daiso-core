---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Lock usage
tags:
    - Lock
    - Usage
    - Namespace
keywords:
    - Lock
    - Usage
    - Namespace
---

# Lock usage

The `@daiso-tech/core/lock` component provides a way for managing locks independent of underlying platform or storage.

## Initial configuration

To begin using the `LockFactory` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
import { LockFactory } from "@daiso-tech/core/lock";

const lockFactory = new LockFactory({
    // You can provide default TTL value
    // If you set it to null it means locks will not expire and most be released manually by default.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemoryLockAdapter(),
});
```

:::info
Here is a complete list of settings for the [`LockFactory`](https://daiso-tech.github.io/daiso-core/types/Lock.LockFactorySettingsBase.html) class.
:::

## Lock basics

### Creating a lock

```ts
const lock = lockFactory.create("shared-resource");
```

### Acquiring and releasing the lock

```ts
const hasAquired = await lock.acquire();
if (hasAquired) {
    try {
        // The critical section
    } finally {
        await lock.release();
    }
}
```

Alternatively you could write it as follows:

```ts
try {
    // This method will throw if the lock is not acquired
    await lock.acquireOrFail();
    // The critical section
} finally {
    await lock.release();
}
```

:::danger
You need always to wrap the critical section with `try-finally` so the lock get released when error occurs.
:::

### Locks with custom TTL

You can provide a custom TTL for the lock.

```ts
const lock = lockFactory.create("shared-resource", {
    // Default TTL is 5min if not overrided
    // If you set it to null it means locks will not expire and most be released manually.
    ttl: TimeSpan.fromSeconds(30),
});
```

### Checking lock state

You can get the lock state by using the `getState` method, it returns [`ILockState`](https://daiso-tech.github.io/daiso-core/types/Lock.ILockState.html).

```ts
import { LOCK_STATE } from "@daiso-tech/core/lock/contracts";

const lock = lockFactory.create("shared-resource");
const state = await lock.getState();

if (state.type === LOCK_STATE.EXPIRED) {
    console.log("The lock doesnt exists");
}

if (state.type === LOCK_STATE.UNAVAILABLE) {
    console.log("Lock is acquired by different owner");
}

if (state.type === LOCK_STATE.ACQUIRED) {
    console.log("The lock is acquired");
}
```

## Patterns

### Refreshing locks

The lock can be refreshed by the current owner before it expires. This is particularly useful for long-running tasks,
instead of setting an excessively long TTL initially, you can start with a shorter one and use the `refresh` method to set the TTL of the lock:

```ts
import { delay } from "@daiso-tech/core/utilities/functions";

const lock = lockFactory.create("resource", {
    ttl: TimeSpan.fromMinutes(1),
});

const hasAcquired = await lock.acquire();
if (hasAcquired) {
    try {
        while (true) {
            await lock.refresh(TimeSpan.fromMinutes(1));
            const hasFinished = await doWork();
            if (hasFinished) {
                break;
            }
            await delay(TimeSpan.fromSeconds(1));
        }
    } finally {
        await lock.release();
    }
}
```

:::warning
Note: A lock must have an expiration (a `ttl` value) to be refreshed. You cannot refresh a lock that was created without an expiration (with `ttl: null`)

```ts
// Create a lock with no expiration (non-refreshable)
const lock = lockFactory.create("resource", {
    ttl: null,
});

// A refresh attempt on this lock will fail
const hasRefreshed = await lock.refresh();

// This will log 'false' because the lock cannot be refreshed
console.log(hasRefreshed);
```

:::

### Additional methods

The `releaseOrFail` method is the same `release` method but it throws an error when not enable to release the lock:

```ts
const lock = lockFactory.create("resource");

await lock.releaseOrFail();
```

The `forceRelease` method releases the lock regardless of the owner:

```ts
const lock = lockFactory.create("resource");

await lock.forceRelease();
```

The `refreshOrFail` method is the same `refresh` method but it throws an error when not enable to refresh the lock:

```ts
const lock = lockFactory.create("resource");

await lock.refreshOrFail();
```

The `runOrFail` method automatically manages lock acquisition and release around function execution.
It calls `acquireOrFail` before invoking the function and calls `release` in a finally block, ensuring the lock is always freed, even if an error occurs during execution.

```ts
const lock = lockFactory.create("resource");

await lock.runOrFail(async () => {
    await doWork();
});
```

:::info
Note the method throws an error when the lock cannot be acquired.
:::

:::info
You can provide synchronous and asynchronous [`Invokable<[], TValue | Promise<TValue>>`](../../utilities/invokable.md) as values for `runOrFail` method.
:::

### Lock instance variables

The `Lock` class exposes instance variables such as:

```ts
const lock = lockFactory.create("resource");

// Will return the key of the lock which is "resource"
console.log(lock.key.toString());

// Will return the id of the lock
console.log(lock.id);

// Will return the ttl of the lock
console.log(lock.ttl);
```

:::info
The `key` field is an object that implements [`IKey`](../namespace.md) contract.
:::

### Lock id

By default the lock id is autogenerated but it can also manually defined.

```ts
const lock = lockFactory.create("lock", {
    lockId: "my-lock-id",
});

const hasAcquire = await lock.acquire();
if (hasAcquired) {
    console.log("Shared resource");
    await lock.release();
}
```

:::info
Manually defining lock id is primarily useful for debugging or implementing manual resource locking by the end user.

An example of manual resource locking by the end user can be found in a multi-user CMS, the end user manually locks a document during editing, this resource lock prevents simultaneous edits and data corruption.
:::

:::warning
In most cases, setting a custom lock id is unnecessary. Misusing this feature could result in different locks sharing the same lock id while modifying the same resource simultaneously, which may lead to race conditions.
:::

### Namespacing

You can use the `Namespace` class to group related locks without conflicts. Since namespacing is not used be default, you need to pass an obeject that implements `INamespace` object.

:::info
For further information about namespacing refer to [`@daiso-tech/core/namespace`](../namespace.md) documentation.
:::

```ts
import { Namespace } from "@daiso-tech/core/namespace";
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import { LockFactory } from "@daiso-tech/core/lock";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");

const lockFactoryA = new LockFactory({
    namespace: new Namespace("@lock-a"),
    adapter: new RedisLockAdapter(database),
});
const lockFactoryB = new LockFactory({
    namespace: new Namespace("@lock-b"),
    adapter: new RedisLockAdapter(database),
});

const lockA = lockFactoryA.create("key", { ttl: null });
const lockB = lockFactoryB.create("key", { ttl: null });

const hasAquiredA = await lockA.acquire();
// Will log true
console.log(hasAquiredA);

const hasAquiredB = await lockB.acquire();
// Will log true
console.log(hasAquiredB);

const hasReleasedB = await lockB.release();
// Will log true
console.log(hasReleasedB);

// Will log { type: "ACQUIRED", remainingTime: null }
console.log(await lockA.getState());

// Will log { type: "EXPIRED" }
console.log(await lockB.getState());
```

### Retrying acquiring lock by attempts

To retry acquiring lock you can use the [`retry`](../resilience.md) middleware.

Retrying acquiring lock with `acquireOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { FailedAcquireLockError } from "@daiso-tech/core/lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";

const lock = lockFactory.create("lock");

const use = useFactory();
try {
    await use(async () => {
        await lock.acquireOrFail();
    }, [
        retry({
            maxAttempts: 4,
            errorPolicy: FailedAcquireLockError,
        }),
    ])();
    // The critical section
} finally {
    await lock.release();
}
```

Retrying acquiring lock with `acquire` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";

const lock = lockFactory.create("lock");

const use = useFactory();
const hasAquired = await use(async () => {
    return await lock.acquire();
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: {
            treatFalseAsError: true,
        },
    }),
])();

if (hasAquired) {
    try {
        // The critical section
    } finally {
        await lock.release();
    }
}
```

Retrying acquiring lock with `runOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { FailedAcquireLockError } from "@daiso-tech/core/lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";

const lock = lockFactory.create("lock");

const use = useFactory();

await use(async () => {
    await lock.runOrFail(async () => {
        // The critical section
    });
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: FailedAcquireLockError,
    }),
])();
```

### Retrying acquiring lock by interval

To retry acquiring lock at regular intervals you can use the [`retryInterval`](../resilience.md) middleware:

Retrying acquiring lock with `acquireOrFail` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { FailedAcquireLockError } from "@daiso-tech/core/lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const lock = lockFactory.create("resource");

const use = useFactory();
try {
    await use(async () => {
        await lock.acquireOrFail();
    }, [
        retryInterval({
            // Time to wait 1 minute
            time: TimeSpan.fromMinutes(1),
            // Interval to try acquire the lock
            interval: TimeSpan.fromSeconds(1),
            errorPolicy: FailedAcquireLockError,
        }),
    ])();
    // The critical section
    await doWork();
} finally {
    await lock.release();
}
```

Retrying acquiring lock with `acquire` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const lock = lockFactory.create("resource");

const use = useFactory();
const hasAcquired = await use(async () => {
    return await lock.acquire();
}, [
    retryInterval({
        time: TimeSpan.fromMinutes(1),
        interval: TimeSpan.fromSeconds(1),
        errorPolicy: {
            treatFalseAsError: true,
        },
    }),
])();

if (hasAcquired) {
    try {
        await doWork();
    } finally {
        await lock.release();
    }
}
```

Retrying acquiring lock with `runOrFail` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { FailedAcquireLockError } from "@daiso-tech/core/lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const lock = lockFactory.create("resource");

const use = useFactory();

await use(async () => {
    await lock.runOrFail(async () => {
        // The critical section
        await doWork();
    });
}, [
    retryInterval({
        time: TimeSpan.fromMinutes(1),
        interval: TimeSpan.fromSeconds(1),
        errorPolicy: FailedAcquireLockError,
    }),
])();
```

:::warning
Note using `retryInterval` middleware with lock acquiring in a HTTP request handler is discouraged because it blocks the HTTP request handler causing the handler wait until the lock becomes available or the timeout is reached. This will delay HTTP request handler to generate response and will make frontend app slow because of HTTP request handler.
:::

### Serialization and deserialization of lock

Locks can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.

This means you can, for example, acquire the lock on the main server, transfer it to a queue worker server, and release it there.

In order to serialize or deserialize a lock you need pass an object that implements [`ISerderRegister`](../serde.md) contract like the [`Serde`](../serde.md) class to `LockFactory`.

Manually serializing and deserializing the lock:

```ts
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import { LockFactory } from "@daiso-tech/core/lock";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const lockFactory = new LockFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisLockAdapter(redisClient),
});

const lock = lockFactory.create("resource");
const serializedLock = serde.serialize(lock);
const deserializedLock = serde.deserialize(lock);
```

:::danger
When serializing or deserializing a lock, you must use the same `Serde` instances that were provided to the `LockFactory`. This is required because the `LockFactory` injects custom serialization logic for `ILock` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the lock manually.

```ts
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import type { ILock } from "@daiso-tech/core/lock/contracts";
import { LockFactory } from "@daiso-tech/core/lock";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-lock-over-network": {
        lock: ILock;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const lockFactory = new LockFactory({
    serde,
    adapter: new RedisLockAdapter(redis),
    eventBus,
});
const lock = lockFactory.create("resource");

// We are sending the lock over the network to other servers.
await eventBus.dispatch("sending-lock-over-network", {
    lock,
});

// The other servers will recieve the serialized lock and automattically deserialize it.
await eventBus.addListener("sending-lock-over-network", ({ lock }) => {
    // The lock is deserialized and can be used
    console.log("LOCK:", lock);
});
```

### Lock events

You can listen to different [lock events](https://daiso-tech.github.io/daiso-core/modules/Lock.html) that are triggered by the `Lock` instance.
Refer to the [`EventBus`](../event_bus/event_bus_usage.md) documentation to learn how to use events. Since no events are dispatched by default, you need to pass an object that implements `IEventBus` contract.

```ts
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
import { LockFactory, LOCK_EVENTS } from "@daiso-tech/core/lock";
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";

const lockFactory = new LockFactory({
    adapter: new MemoryLockAdapter(),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter(),
    }),
});

await lockFactory.events.addListener(LOCK_EVENTS.ACQUIRED, () => {
    console.log("Lock acquired");
});

await lockFactory.create("a").acquire();
```

:::warning
If multiple lock adapters (e.g., `RedisLockAdapter` and `MemoryLockAdapter`) are used at the same time, you need to isolate their events by assigning separate namespaces. This prevents listeners from unintentionally capturing events across adapters.

```ts
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
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

const memoryLockAdapter = new MemoryLockAdapter();
const memoryLockFactory = new LockFactory({
    adapter: memoryLockAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to MemoryLockAdapter and RedisLockAdapter to isolate their events.
        namespace: new Namespace(["memory", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});

const redisLockAdapter = new RedisLockAdapter({
    serde,
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
const redisLockFactory = new LockFactory({
    adapter: redisLockAdapter,
    eventBus: new EventBus({
        // We assign distinct namespaces to MemoryLockAdapter and RedisLockAdapter to isolate their events.
        namespace: new Namespace(["redis", "event-bus"]),
        adapter: redisPubSubEventBusAdapter,
    }),
});
```

:::

### Separating creating, listening to and manipulating locks

The library includes 3 additional contracts:

- [`ILock`](https://daiso-tech.github.io/daiso-core/types/Lock.ILock.html) - Allows only for manipulating of the lock.

- [`ILockFactoryBase`](https://daiso-tech.github.io/daiso-core/types/Lock.ILockFactoryBase.html) - Allows only for creation of locks.

- [`ILockListenable`](https://daiso-tech.github.io/daiso-core/types/Lock.ILockListenable.html) - Allows only to listening to lock events.

This seperation makes it easy to visually distinguish the 3 contracts, making it immediately obvious that they serve different purposes.

```ts
import { EventBus } from "@daiso-tech/core/event-bus";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { LockFactory } from "@daiso-tech/core/lock";
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";
import {
    type ILock,
    type ILockFactoryBase,
    type ILockListenable,
    LOCK_EVENTS,
} from "@daiso-tech/core/lock/contracts";

async function lockFunc(lock: ILock): Promise<void> {
    await lock.runOrFail(async () => {
        await doWork();
    });
}

async function lockFactoryFunc(lockFactory: ILockFactoryBase): Promise<void> {
    // You cannot access the listener methods
    // You will get typescript error if you try

    const lock = lockFactory.create("resource");
    await lockFunc(lock);
}

async function lockListenableFunc(
    lockListenable: ILockListenable,
): Promise<void> {
    // You cannot access the lockFactory methods
    // You will get typescript error if you try

    await lockListenable.addListener(LOCK_EVENTS.ACQUIRED, (event) => {
        console.log("ACQUIRED:", event);
    });
    await lockListenable.addListener(LOCK_EVENTS.RELEASED, (event) => {
        console.log("RELEASED:", event);
    });
}

const lockFactory = new LockFactory({
    adapter: new MemoryLockAdapter(),
    eventBus: new EventBus({
        adapter: new MemoryEventBusAdapter(),
    }),
});
await lockListenableFunc(lockFactory.events);
await lockFactoryFunc(lockFactory);
```

## Further information

For further information refer to [`@daiso-tech/core/lock`](https://daiso-tech.github.io/daiso-core/modules/Lock.html) API docs.

---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Shared-lock usage
tags:
    - Shared-lock
    - Usage
    - Namespace
keywords:
    - Shared-lock
    - Usage
    - Namespace
---

# Shared-lock usage

The `@daiso-tech/core/shared-lock` component provides a way for managing shared-locks (a.k.a reader writer locks) independent of underlying platform or storage.

## Initial configuration

To begin using the `SharedLockFactory` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
import { SharedLockFactory } from "@daiso-tech/core/shared-lock";

const sharedLockFactory = new SharedLockFactory({
    // You can provide default TTL value
    // If you set it to null it means shared-locks will not expire and most be released manually by default.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemorySharedLockAdapter(),
});
```

:::info
Here is a complete list of settings for the [`SharedLockFactory`](https://daiso-tech.github.io/daiso-core/types/SharedLock.SharedLockFactorySettingsBase.html) class.
:::

## Shared lock basics

### Creating a shared-lock

```ts
const sharedLock = sharedLockFactory.create("shared-resource", {
    // You need to define a limit
    limit: 2,
});
```

### Acquiring and releasing the shared-lock as reader

```ts
// 1 slot will be acquired
if (await sharedLock.acquireReader()) {
    console.log("Acquired");
    try {
        // The concurrent section
    } finally {
        await sharedLock.releaseReader();
    }
} else {
    console.log("Unable to acquire");
}

// 2 slots will be acquired
if (await sharedLock.acquireReader()) {
    console.log("Acquired");
    try {
        // The concurrent section
    } finally {
        await sharedLock.releaseReader();
    }
} else {
    console.log("Unable to acquire");
}

// Will log false because the limit is reached
console.log(await sharedLock.acquireReader());
```

Alternatively you could write it as follows:

```ts
// 1 slot will be acquired
try {
    console.log("Acquired");
    // This method will throw if the shared-lock limit is reached.
    await sharedLock.acquireReaderOrFail();
    // The critical section
} catch {
    console.log("Unable to acquire");
} finally {
    await sharedLock.releaseReader();
}

// 2 slots will be acquired
try {
    console.log("Acquired");
    // This method will throw if the shared-lock limit is reached.
    await sharedLock.acquireReaderOrFail();
    // The critical section
} catch {
    console.log("Unable to acquire");
} finally {
    await sharedLock.releaseReader();
}

// Will throw because the limit is reached
await sharedLock.acquireReaderOrFail();
```

:::danger
You need always to wrap the concurrent section with `try-finally` so the shared-lock get released when error occurs.
:::

### Acquiring and releasing the shared-lock as writer

```ts
const hasAquired = await sharedLock.acquireWriter();
if (hasAquired) {
    try {
        // The critical section
    } finally {
        await sharedLock.releaseWriter();
    }
}
```

Alternatively you could write it as follows:

```ts
try {
    // This method will throw if the shared-lock is not acquired
    await sharedLock.acquireWriterOrFail();
    // The critical section
} finally {
    await sharedLock.releaseWriter();
}
```

:::danger
You need always to wrap the critical section with `try-finally` so the shared-lock get released when error occurs.
:::

### Shared lock with custom TTL

You can provide a custom TTL for the shared-lock.

```ts
const sharedLock = sharedLockFactory.create("shared-resource", {
    // Default TTL is 5min if not overrided
    // If you set it to null it means shared-lock will not expire and most be released manually.
    ttl: TimeSpan.fromSeconds(30),
    limit: 2,
});
```

### Checking shared-lock state

You can get the shared-lock state by using the `getState` method, it returns [`ISharedLockState`](https://daiso-tech.github.io/daiso-core/types/SharedLock.ISharedLockState.html).

```ts
import { SHARED_LOCK_STATE } from "@daiso-tech/core/shared-lock/contracts";

const sharedLock = sharedLockFactory.create("shared-resource", {
    limit: 2,
});
const state = await sharedLock.getState();

if (state.type === SHARED_LOCK_STATE.EXPIRED) {
    console.log("The shared-lock doesnt exists");
}

if (state.type === SHARED_LOCK_STATE.READER_LIMIT_REACHED) {
    console.log(
        "The shared-lock is in reader mode and limit have been reached and all slots are unavailable",
    );
}

if (state.type === SHARED_LOCK_STATE.READER_ACQUIRED) {
    console.log("The shared-lock is in reader mode and is acquired");
}

if (state.type === SHARED_LOCK_STATE.READER_UNACQUIRED) {
    console.log(
        "The shared-lock is in reader mode and there are avilable slots but the shared-lock is not acquired",
    );
}

if (state.type === SHARED_LOCK_STATE.WRITER_UNAVAILABLE) {
    console.log(
        "The shared-lock is in writer mode and is acquired by different owner",
    );
}

if (state.type === SHARED_LOCK_STATE.WRITER_ACQUIRED) {
    console.log("The shared-lock is in writer mode and is acquired");
}
```

## Patterns

### Refreshing shared-locks

The shared-lock can be refreshed by the current owner before it expires. This is particularly useful for long-running tasks,
instead of setting an excessively long TTL initially, you can start with a shorter one and use the `refreshWriter` or `refreshReader` method to set the TTL of the shared-lock:

#### As reader

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
    ttl: TimeSpan.fromMinutes(1),
});

async function doWork(): Promise<boolean> {
    // ... critical section
}

const hasAcquired = await sharedLock.acquireWriter();
if (hasAcquired) {
    try {
        while (true) {
            await sharedLock.refreshWriter(TimeSpan.fromMinutes(1));
            const hasFinished = await doWork();
            if (hasFinished) {
                break;
            }
            await delay(TimeSpan.fromSeconds(1));
        }
    } finally {
        await sharedLock.releaseWriter();
    }
}
```

#### As writer

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
    ttl: TimeSpan.fromMinutes(1),
});

async function doWork(): Promise<boolean> {
    // ... critical section
}

const hasAcquired = await sharedLock.acquireWriter();
if (hasAcquired) {
    try {
        while (true) {
            await sharedLock.refreshReader(TimeSpan.fromMinutes(1));
            const hasFinished = await doWork();
            if (hasFinished) {
                break;
            }
            await delay(TimeSpan.fromSeconds(1));
        }
    } finally {
        await sharedLock.releaseReader();
    }
}
```

:::warning
Note: A shared-lock must have an expiration (a `ttl` value) to be refreshed. You cannot refresh a shared-lock that was created without an expiration (with `ttl: null`)

```ts
// Create a shared-lock with no expiration (non-refreshable)
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
    ttl: null,
});

// A writer refresh attempt on this shared-ock will fail
const hasRefreshedWriter = await sharedLock.refreshWriter();

// This will log 'false' because the sharedLock cannot be refreshed
console.log(hasRefreshedWriter);

// A reader refresh attempt on this shared-ock will fail
const hasRefreshedReader = await sharedLock.refreshReader();

// This will log 'false' because the sharedLock cannot be refreshed
console.log(hasRefreshedReader);
```

:::

### Additional writer methods

The `releaseWriterOrFail` method is the same `releaseWriter` method but it throws an error when not enable to release the shared-lock as writer:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.releaseWriterOrFail();
```

The `forceReleaseWriter` method releases the shared-lock regardless of the owner if in writer mode:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.forceReleaseWriter();
```

The `refreshWriterOrFail` method is the same `refreshWriter` method but it throws an error when not enable to refresh the shared-lock as writer:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.refreshWriterOrFail();
```

The `runWriterOrFail` method automatically manages shared-lock acquisition and release as writer around function execution.
It calls `acquireWriterOrFail` before invoking the function and calls `releaseWriter` in a finally block, ensuring the shared-lock is always freed, even if an error occurs during execution.

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.runWriterOrFail(async () => {
    // ... critical section
});
```

:::info
Note the method throws an error when the shared-lock cannot be acquired as writer.
:::

:::info
You can provide synchronous Invokable or async/promisable invokable as values for the `runWriterOrFail` method.
:::

### Additional reader methods

The `releaseReaderOrFail` method is the same `releaseReader` method but it throws an error when not enable to release the shared-lock as reader:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.releaseReaderOrFail();
```

The `forceReleaseAllReaders` method releases all the slots of the shared-lock if in reader mode:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.forceReleaseAllReaders();
```

The `refreshReaderOrFail` method is the same `refreshReader` method but it throws an error when not enable to refresh the shared-lock as reader:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.refreshReaderOrFail();
```

The `runReaderOrFail` method automatically manages shared-lock acquisition and release as reader around function execution.
It calls `acquireReaderOrFail` before invoking the function and calls `releaseReader` in a finally block, ensuring the shared-lock is always freed, even if an error occurs during execution.

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.runReaderOrFail(async () => {
    // ... critical section
});
```

:::info
Note the method throws an error when the shared-lock cannot be acquired as reader.
:::

:::info
You can provide synchronous Invokable or async/promisable invokable as values for the `runReaderOrFail` method.
:::

### Additional methods

The `forceRelease` method releases the shared-lock regardless it its in reader or writer mode:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.forceRelease();
```

### Shared-lock instance variables

The `Shared-lock` class exposes instance variables such as:

```ts
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

// Will return the key of the shared-lock which is "resource"
console.log(sharedLock.key.toString());

// Will return the id of the shared-lock
console.log(sharedLock.id);

// Will return the ttl of the shared-lock
console.log(sharedLock.ttl);
```

:::info
The `key` field is an object that implements [`IKey`](../namespace.md) contract.
:::

### Shared-lock id

By default the shared-lock id is autogenerated but it can also manually defined.

```ts
const sharedLock = sharedLockFactory.create("shared-lock", {
    lockId: "my-shared-lock-id",
});

const hasAcquire = await sharedLock.acquireWriter();
if (hasAcquired) {
    console.log("Shared resource");
    await sharedLock.releaseWriter();
}
```

:::info
Manually defining shared-lock id is primarily useful for debugging or implementing manual resource controll by the end user.
:::

:::warning
In most cases, setting a shared-lock id is unnecessary.
:::

### Namespacing

You can use the `Namespace` class to group related shared-locks without conflicts. Since namespacing is not used be default, you need to pass an obeject that implements `INamespace` object.

:::info
For further information about namespacing refer to [`@daiso-tech/core/namespace`](../namespace.md) documentation.
:::

```ts
import { Namespace } from "@daiso-tech/core/namespace";
import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");

const sharedLockFactoryA = new SharedLockFactory({
    namespace: new Namespace("@sharedLock-a"),
    adapter: new RedisSharedLockAdapter(database),
});
const sharedLockFactoryB = new SharedLockFactory({
    namespace: new Namespace("@sharedLock-b"),
    adapter: new RedisSharedLockAdapter(database),
});

const sharedLockA = await sharedLockFactoryA.create("key", {
    ttl: null,
    limit: 1,
});
const sharedLockB = await sharedLockFactoryB.create("key", {
    ttl: null,
    limit: 1,
});

const hasAquiredA = await sharedLockA.acquireWriter();
// Will log true
console.log(hasAquiredA);

const hasAquiredB = await sharedLockB.acquireWriter();
// Will log true
console.log(hasAquiredB);

const hasReleasedB = await sharedLockB.releaseWriter();
// Will log true
console.log(hasReleasedB);

// Will log { type: "WRITER_ACQUIRED", remainingTime: null }
console.log(await sharedLockA.getState());

// Will log { type: "EXPIRED" }
console.log(await sharedLockB.getState());
```

### Retrying acquiring shared-lock as writer by attempts

To retry acquiring shared-lock as writer you can use the [`retry`](../resilience.md) middleware.

Retrying acquiring shared-lock as writer with `acquireWriterOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { FailedAcquireWriterLockError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

const use = useFactory();
try {
    await use(async () => {
        await sharedLock.acquireWriterOrFail();
    }, [
        retry({
            maxAttempts: 4,
            errorPolicy: FailedAcquireWriterLockError,
        }),
    ])();
    // The critical section
} finally {
    await sharedLock.release();
}
```

Retrying acquiring sharedLock as writer with `acquireWriter` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

const use = useFactory();
const hasAquired = await use(async () => {
    return await sharedLock.acquireWriter();
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
        await sharedLock.release();
    }
}
```

Retrying acquiring shared-lock as writer with `runWriterOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { FailedAcquireWriterLockError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

const use = useFactory();
await use(async () => {
    await sharedLock.runWriterOrFail(async () => {
        // The critical section
    });
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: FailedAcquireWriterLockError,
    }),
])();
```

### Retrying acquiring shared-lock as reader by attempts

To retry acquiring shared-lock as reader you can use the [`retry`](../resilience.md) middleware.

Retrying acquiring shared-lock as reader with `acquireReaderOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { LimitReachedReaderSemaphoreError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

const use = useFactory();
try {
    await use(async () => {
        await sharedLock.acquireReaderOrFail();
    }, [
        retry({
            maxAttempts: 4,
            errorPolicy: LimitReachedReaderSemaphoreError,
        }),
    ])();
    // The critical section
} finally {
    await sharedLock.release();
}
```

Retrying acquiring sharedLock as reader with `acquireReader` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

const use = useFactory();
const hasAquired = await use(async () => {
    return await sharedLock.acquireReader();
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
        await sharedLock.release();
    }
}
```

Retrying acquiring shared-lock as reader with `runReaderOrFail` method:

```ts
import { retry } from "@daiso-tech/core/resilience";
import { LimitReachedReaderSemaphoreError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
});

const use = useFactory();
await use(async () => {
    await sharedLock.runReaderOrFail(async () => {
        // The critical section
    });
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: LimitReachedReaderSemaphoreError,
    }),
])();
```

### Retrying acquiring shared-lock as writer by interval

To retry acquiring shared-lockas as writer at regular intervals you can use the [`retryInterval`](../resilience.md) middleware.

Retrying acquiring shared-lock with `acquireWriterOrFail` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { FailedAcquireWriterLockError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

const use = useFactory();
try {
    await use(async () => {
        await sharedLock.acquireWriterOrFail();
    }, [
        retryInterval({
            // Time to wait 1 minute
            time: TimeSpan.fromMinutes(1),
            // Interval to try acquire the shared-lock
            interval: TimeSpan.fromSeconds(1),
            errorPolicy: FailedAcquireWriterLockError,
        }),
    ])();
    // ... critical section
} finally {
    await sharedLock.releaseWriter();
}
```

Retrying acquiring shared-lock with `acquireWriter` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

const use = useFactory();
const hasAcquired = await use(async () => {
    return await sharedLock.acquireWriter();
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
        // ... critical section
    } finally {
        await sharedLock.releaseWriter();
    }
}
```

Retrying acquiring shared-lock with `runWriterOrFail` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { FailedAcquireWriterLockError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

const use = useFactory();

await use(async () => {
    await sharedLock.runWriterOrFail(async () => {
        // ... critical section
    });
}, [
    retryInterval({
        time: TimeSpan.fromMinutes(1),
        interval: TimeSpan.fromSeconds(1),
        errorPolicy: FailedAcquireWriterLockError,
    }),
])();
```

:::warning
Note using `retryInterval` middleware with shared-lock acquiring in a HTTP request handler is discouraged because it blocks the HTTP request handler causing the handler wait until the shared-lock becomes available or the timeout is reached. This will delay HTTP request handler to generate response and will make frontend app slow because of HTTP request handler.
:::

### Retrying acquiring shared-lock as reader by interval

To retry acquiring shared-lockas as reader at regular intervals you can use the [`retryInterval`](../resilience.md) middleware.

Retrying acquiring shared-lock with `acquireReaderOrFail` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { LimitReachedReaderSemaphoreError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

const use = useFactory();
try {
    await use(async () => {
        await sharedLock.acquireReaderOrFail();
    }, [
        retryInterval({
            // Time to wait 1 minute
            time: TimeSpan.fromMinutes(1),
            // Interval to try acquire the shared-lock
            interval: TimeSpan.fromSeconds(1),
            errorPolicy: LimitReachedReaderSemaphoreError,
        }),
    ])();
    // ... critical section
} finally {
    await sharedLock.releaseReader();
}
```

Retrying acquiring shared-lock with `acquireReader` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

const use = useFactory();
const hasAcquired = await use(async () => {
    return await sharedLock.acquireReader();
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
        // ... critical section
    } finally {
        await sharedLock.releaseReader();
    }
}
```

Retrying acquiring shared-lock with `runReaderOrFail` method:

```ts
import { retryInterval } from "@daiso-tech/core/resilience";
import { LimitReachedReaderSemaphoreError } from "@daiso-tech/core/shared-lock/contracts";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

const use = useFactory();

await use(async () => {
    await sharedLock.runReaderOrFail(async () => {
        // ... critical section
    });
}, [
    retryInterval({
        time: TimeSpan.fromMinutes(1),
        interval: TimeSpan.fromSeconds(1),
        errorPolicy: LimitReachedReaderSemaphoreError,
    }),
])();
```

:::warning
Note using `retryInterval` middleware with shared-lock acquiring in a HTTP request handler is discouraged because it blocks the HTTP request handler causing the handler wait until the shared-lock becomes available or the timeout is reached. This will delay HTTP request handler to generate response and will make frontend app slow because of HTTP request handler.
:::

### Serialization and deserialization of shared-lock

Shared-locks can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the shared-lock on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a shared-lock you need pass an object that implements [`ISerderRegister`](../serde.md) contract like the [`Serde`](../serde.md) class to `SharedLockFactory`.

Manually serializing and deserializing the shared-lock:

```ts
import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const sharedLockFactory = new SharedLockFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisSharedLockAdapter(redisClient),
});

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});
const serializedSharedLock = serde.serialize(sharedLock);
const deserializedSharedLock = serde.deserialize(sharedLock);
```

:::danger
When serializing or deserializing a shared-lock, you must use the same `Serde` instances that were provided to the `SharedLockFactory`. This is required because the `SharedLockFactory` injects custom serialization logic for `ISharedLock` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the shared-lock manually.

```ts
import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
import type { ISharedLock } from "@daiso-tech/core/shared-lock/contracts";
import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "@daiso-tech/core/event-bus";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-shared-lock-over-network": {
        sharedLock: ISharedLock;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const sharedLockFactory = new SharedLockFactory({
    serde,
    adapter: new RedisSharedLockAdapter(redis),
    eventBus,
});
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

// We are sending the shared-lock over the network to other servers.
await eventBus.dispatch("sending-shared-lock-over-network", {
    sharedLock,
});

// The other servers will recieve the serialized shared-lock and automattically deserialize it.
await eventBus.addListener(
    "sending-shared-lock-over-network",
    ({ sharedLock }) => {
        // The shared-lock is deserialized and can be used
        console.log("SHARED_LOCK:", sharedLock);
    },
);
```

### Shared-lock events

You can listen to different [shared-lock events](https://daiso-tech.github.io/daiso-core/modules/SharedLock.html) that are triggered by the `Shared-lock` instance.
Refer to the [`EventBus`](../event_bus/event_bus_usage.md) documentation to learn how to use events. Since no events are dispatched by default, you need to pass an object that implements `IEventBus` or `IEventBusAdapter` contract.

```ts
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
import {
    SharedLockFactory,
    SHARED_LOCK_EVENTS,
} from "@daiso-tech/core/shared-lock";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";

const redisPubSubEventBusAdapter = new MemoryEventBusAdapter();

const sharedLock = new SharedLockFactory({
    adapter: new MemorySharedLockAdapter(),
    eventBus: redisPubSubEventBusAdapter,
});

await sharedLockFactory.events.addListener(
    SHARED_LOCK_EVENTS.WRITER_ACQUIRED,
    () => {
        console.log("Lock acquired");
    },
);

await sharedLockFactory.create("a", { limit: 2 }).acquireWriter();
```

:::warning
If multiple shared-lock adapters (e.g., `RedisSharedLockAdapter` and `MemorySharedLockAdapter`) are used at the same time, you need to isolate their events by assigning separate namespaces. This prevents listeners from unintentionally capturing events across adapters.

```ts
import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
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

const memorySharedLockAdapter = new MemorySharedLockAdapter();
const memorySharedLockFactory = new SharedLockFactory({
    adapter: memorySharedLockAdapter,
    // We assign distinct namespaces to MemorySharedLockAdapter and RedisSharedLockAdapter to isolate their events.
    namespace: new Namespace(["memory", "event-bus"]),
    eventBus: redisPubSubEventBusAdapter,
});

const redisSharedLockAdapter = new RedisSharedLockAdapter({
    serde,
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
const redisSharedLockFactory = new SharedLockFactory({
    adapter: redisSharedLockAdapter,
    // We assign distinct namespaces to MemorySharedLockAdapter and RedisSharedLockAdapter to isolate their events.
    namespace: new Namespace(["redis", "event-bus"]),
    eventBus: redisPubSubEventBusAdapter,
});
```

:::

### Separating creating, listening to and manipulating shared-lock

The library includes 3 additional contracts:

- [`ISharedLock`](https://daiso-tech.github.io/daiso-core/types/SharedLock.ISharedLock.html) - Allows only for manipulating of the shared-lock.

- [`IWriterLock`](https://daiso-tech.github.io/daiso-core/types/SharedLock.IWriterLock.html) - Allows only for manipulating of the shared-lock as writer.

- [`IReaderSemaphore`](https://daiso-tech.github.io/daiso-core/types/SharedLock.IReaderSemaphore.html) - Allows only for manipulating of the shared-lock as reader.

- [`ISharedLockFactoryBase`](https://daiso-tech.github.io/daiso-core/types/SharedLock.ISharedLockFactoryBase.html) - Allows only for creation of shared-locks.

- [`ISharedLockListenable`](https://daiso-tech.github.io/daiso-core/types/SharedLock.ISharedLockListenable.html) - Allows only to listening to shared-lock events.

This seperation makes it easy to visually distinguish the 3 contracts, making it immediately obvious that they serve different purposes.

```ts
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus/memory-event-bus-adapter";
import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";
import {
    type ISharedLock,
    type ISharedLockFactoryBase,
    type ISharedLockListenable,
    type IWriterLock,
    type IReaderSemaphore,
    SHARED_LOCK_EVENTS,
} from "@daiso-tech/core/shared-lock/contracts";

async function writerLockFunc(writerLock: IWriterLock): Promise<void> {
    // You cannot access the writer methods
    // You will get typescript error if you try

    await writerLock.runWriterOrFail(async () => {
        // ... critical section
    });
}

async function readerSemaphoreFunc(
    readerSemaphore: IReaderSemaphore,
): Promise<void> {
    // You cannot access the reader methods
    // You will get typescript error if you try

    await readerSemaphore.runReaderOrFail(async () => {
        // ... critical section
    });
}

async function sharedLockFunc(sharedLock: ISharedLock): Promise<void> {
    await writerLockFunc(sharedLock);
    await readerSemaphoreFunc(sharedLock);

    // You can access this method because it is not part of the writer or reader methods.
    await sharedLock.forceRelease();
}

async function sharedLockFactoryFunc(
    sharedLockFactory: ISharedLockFactoryBase,
): Promise<void> {
    // You cannot access the listener methods
    // You will get typescript error if you try

    const sharedLock = sharedLockFactory.create("resource", {
        limit: 2,
    });
    await sharedLockFunc(sharedLock);
}

async function sharedLockListenableFunc(
    sharedLockListenable: ISharedLockListenable,
): Promise<void> {
    // You cannot access the sharedLockFactory methods
    // You will get typescript error if you try

    await sharedLockListenable.addListener(
        SHARED_LOCK_EVENTS.WRITER_ACQUIRED,
        (event) => {
            console.log("WRITER ACQUIRED:", event);
        },
    );
    await sharedLockListenable.addListener(
        SHARED_LOCK_EVENTS.WRITER_RELEASED,
        (event) => {
            console.log("WRITER RELEASED:", event);
        },
    );

    await sharedLockListenable.addListener(
        SHARED_LOCK_EVENTS.READER_ACQUIRED,
        (event) => {
            console.log("READER ACQUIRED:", event);
        },
    );
    await sharedLockListenable.addListener(
        SHARED_LOCK_EVENTS.READER_RELEASED,
        (event) => {
            console.log("READER RELEASED:", event);
        },
    );
}

const sharedLockFactory = new SharedLockFactory({
    adapter: new MemorySharedLockAdapter(),
    eventBus: new MemoryEventBusAdapter(),
});
await sharedLockListenableFunc(sharedLockFactory.events);
await sharedLockFactoryFunc(sharedLockFactory);
```

## Further information

For further information refer to [`@daiso-tech/core/shared-lock`](https://daiso-tech.github.io/daiso-core/modules/SharedLock.html) API docs.

---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Cache usage
tags:
 - Cache
 - Usage
 - Namespace
keywords:
 - Cache
 - Usage
 - Namespace
---

# Cache usage

The `@daiso-tech/core/cache` component provides a way for storing key-value pairs with expiration independent of data storage

## Initial configuration

To begin using the `Cache` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

const cache = new Cache({
    // You can provide default TTL value
    // If you set it to null it means keys will be stored forever.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemoryCacheAdapter(),
});
```

:::info
Here is a complete list of settings for the [`Cache`](https://daiso-tech.github.io/daiso-core/types/Cache.CacheSettingsBase.html) class.
:::

## Cache basics

### Adding keys

You can add a key with a optional TTL to overide the default:

```ts
await cache.add("a", "value", { ttl: TimeSpan.fromSeconds("1") });
```
The method returns true if the key does not exists.

### Retrieving keys

You can retrieve the key:

```ts
await cache.get("a");
```

### Checking key existence

You can check if the key exists:

```ts
await cache.exists("a");
```

You can check if the key is missing:

```ts
await cache.missing("a");
```

### Updating keys

You can update a key and true will be returned if the key exists and was updated:

```ts
await cache.update("a", 2);
```

You can increment the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown:

```ts
await cache.increment("a", 2);
```

You can decrement the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown,:

```ts
await cache.decrement("a", 1);
```

You can perform an upsert that replaces the ttl when updated. True will be returned if the key was updated otherwise false is returned:

```ts
await cache.put("a", 2);
await cache.put("a", 4, { ttl: TimeSpan.fromSeconds(3) });
```


### Removing keys

You can remove a key and true will be returned if the key was found and removed:

```ts
await cache.remove("a");
```

You can remove multiple keys and true will be returned if one of the keys exists and where removed:

```ts
await cache.removeMany(["a", "b"]);
```

You can clear all the keys of the given namespace:

```ts
await cache.clear();
```

## Patterns

### Compile time type safety

You can enforce compile time type safety by setting the cache value type:

```ts
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

type IUser = {
    name: string;
    email: string;
    age: number;
};

const cache = new Cache<IUser>({
    adapter: new MemoryCacheAdapter(),
});

// A typescript error will occur because the type is not matching.
await cache.add("a", "asd");
```

If you have multiple types you can use algeberical enums:

```ts
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

type IUser = {
    type: "USER";
    name: string;
    email: string;
    age: number;
};
type IProduct = {
    type: "PRODUCT";
    name: string;
    price: number;
};
type CacheValue = IUser | IProduct;

const cache = new Cache<CacheValue>({
    adapter: new MemoryCacheAdapter(),
});

const cacheValue = await cache.get("user1");
// You need to check the type is "USER" inorder to access IUser fields.
if (cacheValue.type === "USER") {
    console.log(cacheValue.name, cacheValue.age);
}
// You need to check the type is "PRODUCT" inorder to access IProduct fields.
if (cacheValue.type === "PRODUCT") {
    console.log(cacheValue.name, cacheValue.price);
}
```

Alternatively you can use different `Cache` classes with different namespaces:

```ts
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";

const cacheAdapter = new MemoryCacheAdapter();

type IUser = {
    name: string;
    email: string;
    age: number;
};
const userCache = new Cache<IUser>({
    adapter: cacheAdapter,
});

type IProduct = {
    name: string;
    price: number;
};
const productCache = new Cache<IProduct>({
    adapter: cacheAdapter,
});
```

### Runtime type safety

You can enforce runtime and compiletime type safety by passing [standard schema](https://standardschema.dev/) to the cache:

```ts
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { z } from "zod";

const userSchema = z.object({
    name: z.string(),
    email: z.string(),
    age: z.number(),
});

// The type will be infered
const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
    schema: userSchema
});

// A typescript and runtime error will occur because the type is not matching.
await cache.add("a", "asd")
```

### Additional methods

You can retrieve the key and if it does not exist an error will be thrown:

```ts
await cache.getOrFail("ab");
```

You can retrieve the key and if it does not exist you can return a default value:

```ts
await cache.getOr("ab", 1);
```

You can retrieve the key and if it does not exist you can insert a default value that will aslo be returned:

```ts
await cache.getOrAdd("ab", 1);
```

:::info
You can provide synchronous or asynchronous [`Invokable<[], TValue | Promise<TValue>>`](../../utilities/invokable.md) as default values for both `getOr` and `getOrAdd` methods.
:::

You can retrieve the key and afterwards remove it and will return true if the value was found:

```ts
await cache.getAndRemove("ab");
```

You can add key and if it does exist an error will be thrown:

```ts
await cache.addOrFail("ab", 1);
```

You can update the key and if it does not exist an error will be thrown:

```ts
await cache.updateOrFail("ab", 1);
```

You can increment the key and if it does not exist an error will be thrown:

```ts
await cache.incrementOrFail("ab", 1);
```

You can decrement the key and if it does not exist an error will be thrown:

```ts
await cache.decrementOrFail("ab", 1);
```

You can remove the key and if it does not exist an error will be thrown:

```ts
await cache.removeOrFail("ab");
```

### Adding jitter to ttl

TTL jitter adds a small random offset to expiration times, which resolves the [cache stampede](https://en.wikipedia.org/wiki/Cache_stampede). When many cache keys expire at the same time, every client simultaneously misses the cache and floods the data source with requests. By spreading out expiration times, jitter ensures cache misses are staggered, distributing the load on your data source evenly over time.

```ts
await cache.add("a", 1, { 
    ttl: TimeSpan.fromMinutes(1),
    jitter: 0.2
})
```

:::info
You can enable jitter in the following methods: `addOrFail`, `put` and `getOrAdd`.
:::

### Cache locking

The `getOrAdd` method supports distributed locking via the `enableLocking` setting. When multiple clients simultaneously request a key that is missing, without locking they all compute the value and write it to the cache — this is known as a [cache stampede](https://en.wikipedia.org/wiki/Cache_stampede). Enabling locking ensures that only one client computes and stores the value while the others wait and then read the cached result.

To use locking, pass a `lockFactory` to the `Cache` constructor:

```ts
import { Cache } from "@daiso-tech/core/cache";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import Redis from "ioredis";

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
    lockFactory: new RedisLockAdapter(new Redis("YOUR_REDIS_CONNECTION_STRING")),
});
```

Then pass `enableLocking: true` to `getOrAdd`:

```ts
const value = await cache.getOrAdd(
    "user:1",
    async () => {
        // This expensive computation runs only once even under concurrent requests
        return await fetchUserFromDatabase(1);
    },
    { enableLocking: true },
);
```

:::info
You can pass `ILockFactoryBase`, `ILockAdapter`, and `IDatabaseLockAdapter` to `lockFactory` setting.
For further information about `LockFactory` refer to the [`@daiso-tech/core/lock`](../lock/lock_usage.md) documentation.
:::

:::warning
The `lockFactory` defaults to a `NoOpLockAdapter` implementation, so `enableLocking: true` has no effect unless you provide a real lock adapter.
:::

### Namespacing

You can use the `Namespace` class to group related data without conflicts. Since namespacing is not used be default, you need to pass an obeject that implements `INamespace` object.

:::info
For further information about namespacing refer to [`@daiso-tech/core/namespace`](../namespace.md) documentation.
:::

```ts
import { Namespace } from "@daiso-tech/core/namespace";
import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const serde = new Serde(new SuperJsonSerdeAdapter());

const cacheA = new Cache({
    namespace: new Namespace("@cache-a"),
    adapter: new RedisCacheAdapter({
        database,
        serde,
    }),
});
const cacheB = new Cache({
    namespace: new Namespace("@cache-b"),
    adapter: new RedisCacheAdapter({
        database,
        serde,
    }),
});

await cacheA.add("key", 1);

// cacheA Logs 1
console.log(await cacheA.get("key"));

// cacheB Logs null
console.log(await cacheB.get("key"));

await cacheB.add("key", "tests");

// cacheB Logs "test"
console.log(await cacheB.get("key"));

// cacheA still Logs 1
console.log(await cacheA.get("key"));
```

### Cache events

You can listen to different [cache events](https://daiso-tech.github.io/daiso-core/modules/Cache.html) that are triggered by the `Cache` instance.
Refer to the [`@daiso-tech/core/event-bus`](../event_bus/event_bus_usage.md) documentation to learn how to use events. Since no events are dispatched by default, you need to pass an object that implements `IEventBus` or `IEventBusAdapter` contract.


```ts
import { CACHE_EVENTS } from "@daiso-tech/core/cache/contracts";

// Will log whenever an item is added, updated and removed
await cache.events.subscribe(CACHE_EVENTS.ADDED, (event) => {
    console.log(event);
});

await cache.add("a", "b");
```

:::warning
If multiple cache adapters (e.g., `RedisCacheAdapter` and `MemoryCacheAdapter`) are used at the same time, you need to isolate their events by assigning separate namespaces. This prevents listeners from unintentionally capturing events across adapters.

```ts
import { RedisCacheAdapter } from "@daiso-tech/core/cache/redis-cache-adapter";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { Namespace } from "@daiso-tech/core/namespace";
import { RedisPubSubEventBusAdapter } from "@daiso-tech/core/event-bus/redis-pub-sub-event-bus-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisPubSubEventBusAdapter = new RedisPubSubEventBusAdapter({
    client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
    serde,
});

const memoryCacheAdapter = new MemoryCacheAdapter();
const memoryCache = new Cache({
    adapter: memoryCacheAdapter,
    // We assign distinct namespaces to MemoryCacheAdapter and RedisCacheAdapter to isolate their events.
    namespace: new Namespace(["memory", "event-bus"]),
    eventBus: redisPubSubEventBusAdapter
});

const redisCacheAdapter = new RedisCacheAdapter({
    serde,
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
const redisCache = new Cache({
    adapter: redisCacheAdapter,
    // We assign distinct namespaces to MemoryCacheAdapter and RedisCacheAdapter to isolate their events.
    namespace: new Namespace(["redis", "event-bus"]),
    eventBus: redisPubSubEventBusAdapter
});
```

:::

### Separating reading cache, manipulating cache and listening

The library includes two additional contracts:

- [`IReadableCache`](https://daiso-tech.github.io/daiso-core/types/Cache.IReadableCache.html) - Allows only for reading cache.

- [`ICacheBase`](https://daiso-tech.github.io/daiso-core/types/Cache.ICacheBase.html) - Allows only for reading and manipulating the cache.

- [`ICacheListenable`](https://daiso-tech.github.io/daiso-core/types/Cache.ICacheListenable.html) - Allows only for listening to cache events.

This seperation makes it easy to visually distinguish the two contracts, making it immediately obvious that they serve different purposes.

```ts
import type {
    ICache,
    ICacheBase,
    IReadableCache,
    ICacheListenable,
    CACHE_EVENTS,
} from "@daiso-tech/core/cache/contracts";
import { Cache } from "@daiso-tech/core/cache";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/adapter/memory-cache-adapter";
import { MemoryEventBus } from "@daiso-tech/core/event-bus/memory-event-bus";

async function readingFunc(cache: IReadableCache): Promise<void> {
    // You cannot access the listener methods
    // You cannot access write methods like put, add and update
    // You will get typescript error if you try

    console.lolg("reading only:", await cache.get("a"))
}
async function manipulatingFunc(cache: ICacheBase): Promise<void> {
    // You cannot access the listener methods
    // You will get typescript error if you try

    await cache.add("a", 1);
    console.lolg("writing and reading:", await cache.get("a"))
}
async function listenerFunc(cacheListenable: ICacheListenable): Promise<void> {
    // You cannot access the cache methods
    // You will get typescript error if you try

    await cacheListenable.addListener(CACHE_EVENTS.ADDED, (event) => {
        console.log("EVENT:", event);
    });
}

const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
    eventBus: new MemoryEventBus()
})
await listenerFunc(cache.events);
await manipulatingFunc(cache);
```

## Further information

For further information refer to [`@daiso-tech/core/cache`](https://daiso-tech.github.io/daiso-core/modules/Cache.html) API docs.

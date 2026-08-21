---
sidebar_position: 1
sidebar_label: Usage
pagination_label: RateLimiter Usage
tags:
    - RateLimiter
    - Usage
keywords:
    - RateLimiter
    - Usage
---

# RateLimiter usage

The `eridu-tech/rate-limiter` component provides a way for managing rate-limiter independent of underlying platform or storage.

## Initial configuration

To begin using the `RateLimiterFactory` class, you'll need to create and configure an instance:

```ts
import { TimeSpan } from "eridu-tech/time-span";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";

const rateLimiterFactory = new RateLimiterFactory({
    // You can provide default settings
    // You can choose the adapter to use
    adapter: new DatabaseRateLimiterAdapter({
        adapter: new MemoryRateLimiterStorageAdapter(),
    }),
});
```

:::info
Here is a complete list of settings for the [`RateLimiterFactory`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.RateLimiterFactorySettingsBase.html) class.
:::

## RateLimiter basics

### Creating a rate-limiter

```ts
const rateLimiter = rateLimiterFactory.create("resource");
```

### Using the rate-limiter

```ts
// The function will only be called when the rate-limiter allows the attempt.
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
});
```

:::info
Note the method throws an error when the rate-limiter is blocked.
:::

:::info
You can provide synchronous or asynchronous [`Invocable<[], TValue | Promise<TValue>>`](../../utilities/invocable.md) as values for the `runOrFail` method.
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
});
```

### Applying rate-limiter on certiain errors

```ts
class ErrorA extends Error {}

const rateLimiter = rateLimiterFactory.create("resource", {
    onlyError: true,
    // Error policy will only work "onlyError" is set to true
    errorPolicy: ErrorA,
});
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
});
```

### Reseting the rate-limiter

You can reset rate-limiter state to the allowed state manually.

```ts
await rateLimiter.reset();
```

### Checking rate-limiter state

You can get the rate-limiter state by using the `getState` method, it returns [`RateLimiterState`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.RateLimiterState.html).

```ts
import { RATE_LIMITER_STATE } from "eridu-tech/rate-limiter/contracts";

const state = await rateLimiter.getState();

if (state === RATE_LIMITER_STATE.EXPIRED) {
    console.log("The rate limiter key doesnt exists");
}
if (state === RATE_LIMITER_STATE.ALLOWED) {
    console.log("The rate limiter is allowing calls");
}
if (state === RATE_LIMITER_STATE.BLOCKED) {
    console.log("The rate limiter is blocking calls");
}
```

### RateLimiter instance variables

The `RateLimiter` class exposes instance variables such as:

```ts
const rateLimiter = rateLimiterFactory.create("resource");

// Will return the key of the rate-limiter which is "resource"
console.log(rateLimiter.key);
```

## Patterns

### Serialization and deserialization of rate-limiters

rate-limiters can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the rate-limiter on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a rate-limiter you need pass an object that implements [`ISerderRegister`](../serde.md) contract like the [`Serde`](../serde.md) class to `RateLimiterFactory`.

Manually serializing and deserializing the rate-limiter:

```ts
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

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
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import type { IRateLimiter } from "eridu-tech/rate-limiter/contracts";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

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
await eventBus.addListener(
    "sending-rate-limiter-over-network",
    ({ rateLimiter }) => {
        // The rateLimiter is deserialized and can be used
        console.log("RATE_LIMITER:", rateLimiter);
    },
);
```

### Separating rate-limiter creation from usage

The library includes 2 additional contracts:

- [`IRateLimiter`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiter.html) - Allows only for manipulating of the rate-limiter.

- [`IRateLimiterFactory`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterFactory.html) - Allows only for creation of rate-limiters.

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.

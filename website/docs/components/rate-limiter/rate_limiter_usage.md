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

```ts file=./rate_limiter_usage-samples/rate_limiter_factory_initial_config.ts
```

:::info
Here is a complete list of settings for the [`RateLimiterFactory`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.RateLimiterFactorySettingsBase.html) class.
:::

## RateLimiter basics

### Creating a rate-limiter

```ts file=./rate_limiter_usage-samples/rate_limiter_create.ts
```

### Using the rate-limiter

```ts file=./rate_limiter_usage-samples/rate_limiter_run_or_fail.ts
```

:::info
Note the method throws an error when the rate-limiter is blocked.
:::

:::info
You can provide synchronous or asynchronous [`Invocable<[], TValue | Promise<TValue>>`](../../utilities/invocable.md) as values for the `runOrFail` method.
:::

### Applying rate-limiter on only erros

The rate-limiter defaults to counting all attempts. You can optionally configure it to track only failed requests.

```ts file=./rate_limiter_usage-samples/rate_limiter_only_error.ts
```

### Applying rate-limiter on certiain errors

```ts file=./rate_limiter_usage-samples/rate_limiter_error_policy.ts
```

### Reseting the rate-limiter

You can reset rate-limiter state to the allowed state manually.

```ts file=./rate_limiter_usage-samples/rate_limiter_reset.ts
```

### Checking rate-limiter state

You can get the rate-limiter state by using the `getState` method, it returns [`RateLimiterState`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.RateLimiterState.html).

```ts file=./rate_limiter_usage-samples/rate_limiter_get_state.ts
```

### RateLimiter instance variables

The `RateLimiter` class exposes instance variables such as:

```ts file=./rate_limiter_usage-samples/rate_limiter_instance_variables.ts
```

## Patterns

### Serialization and deserialization of rate-limiters

rate-limiters can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the rate-limiter on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a rate-limiter you need pass an object that implements [`ISerderRegister`](../serde/serde.md) contract like the [`Serde`](../serde/serde.md) class to `RateLimiterFactory`.

Manually serializing and deserializing the rate-limiter:

```ts file=./rate_limiter_usage-samples/rate_limiter_manual_serialization.ts
```

:::danger
When serializing or deserializing a rate-limiter, you must use the same `Serde` instances that were provided to the `RateLimiterFactory`. This is required because the `RateLimiterFactory` injects custom serialization logic for `IRateLimiter` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the rate-limiter manually.

```ts file=./rate_limiter_usage-samples/rate_limiter_event_bus_serialization.ts
```

### Separating rate-limiter creation from usage

The library includes 2 additional contracts:

- [`IRateLimiter`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiter.html) - Allows only for manipulating of the rate-limiter.

- [`IRateLimiterFactory`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterFactory.html) - Allows only for creation of rate-limiters.

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.

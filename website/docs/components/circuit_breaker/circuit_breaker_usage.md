---
sidebar_position: 1
sidebar_label: Usage
pagination_label: CircuitBreaker Usage
tags:
    - CircuitBreaker
    - Usage
keywords:
    - CircuitBreaker
    - Usage
---

# CircuitBreaker usage

The `eridu-tech/circuit-breaker` component provides a way for managing circuit-breaker independent of underlying platform or storage.

## Initial configuration

To begin using the `CircuitBreakerFactory` class, you'll need to create and configure an instance:

```ts file=./circuit_breaker_usage-samples/circuit_breaker_initial_config.ts
```

:::info
Here is a complete list of settings for the [`CircuitBreakerFactory`](https://eridu-tech.github.io/eridu-tech-core/types/CircuitBreaker.CircuitBreakerFactorySettingsBase.html) class.
:::

## CircuitBreaker basics

### Creating a circuit-breaker

```ts file=./circuit_breaker_usage-samples/circuit_breaker_create.ts
```

### Using the circuit-breaker

```ts file=./circuit_breaker_usage-samples/circuit_breaker_run_or_fail.ts
```

:::info
Note the method throws an error when the circuit-breaker is in open state or isolated state.
:::

:::info
You can provide synchronous or asynchronous [`Invocable<[], TValue | Promise<TValue>>`](../../utilities/invocable/invocable.md) as values for the `runOrFail` method.
:::

### Applying circuit-breaker on certiain errors

```ts file=./circuit_breaker_usage-samples/circuit_breaker_error_policy.ts
```

### Setting circuit-breaker triggers

By default the the circuit-breaker will treat errors and slow calls as failures. You can explicitly set ths option.

The `CIRCUIT_BREAKER_TRIGGER.BOTH` will treat error and slow calls as failures.

```ts file=./circuit_breaker_usage-samples/circuit_breaker_trigger_both.ts
```

The `CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR` will treat only errors as failures.

```ts file=./circuit_breaker_usage-samples/circuit_breaker_trigger_only_error.ts
```

The `CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL` will treat slow calls as failures.

```ts file=./circuit_breaker_usage-samples/circuit_breaker_trigger_only_slow_call.ts
```

### Setting the slow call threshold

You can set custom slow call threshold that will be used when treating slow calls as failures.

```ts file=./circuit_breaker_usage-samples/circuit_breaker_slow_call_threshold.ts
```

### Reseting the circuit-breaker

You can reset circuit-breaker state to the closed state manually.

```ts file=./circuit_breaker_usage-samples/circuit_breaker_reset.ts
```

### Isolating the circuit-breaker

You can manually hold circuit-breaker in open state until reseted.

```ts file=./circuit_breaker_usage-samples/circuit_breaker_isolate.ts
```

### Checking circuit-breaker state

You can get the circuit-breaker state by using the `getState` method, it returns [`CircuitBreakerState`](https://eridu-tech.github.io/eridu-tech-core/types/CircuitBreaker.CircuitBreakerState.html).

```ts file=./circuit_breaker_usage-samples/circuit_breaker_get_state.ts
```

### CircuitBreaker instance variables

The `CircuitBreaker` class exposes instance variables such as:

```ts file=./circuit_breaker_usage-samples/circuit_breaker_instance_variables.ts
```

## Patterns

### Serialization and deserialization of circuit-breakers

circuit-breakers can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the circuit-breaker on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a circuit-breaker you need pass an object that implements [`ISerderRegister`](../serde/serde.md) contract like the [`Serde`](../serde/serde.md) class to `CircuitBreakerFactory`.

Manually serializing and deserializing the circuit-breaker:

```ts file=./circuit_breaker_usage-samples/circuit_breaker_manual_serialization.ts
```

:::danger
When serializing or deserializing a circuit-breaker, you must use the same `Serde` instances that were provided to the `CircuitBreakerFactory`. This is required because the `CircuitBreakerFactory` injects custom serialization logic for `ICircuitBreaker` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the circuit-breaker manually.

```ts file=./circuit_breaker_usage-samples/circuit_breaker_event_bus_serialization.ts
```

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.

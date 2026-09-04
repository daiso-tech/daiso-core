---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: CircuitBreaker resolver classes
tags:
    - CircuitBreaker
    - Resolvers
keywords:
    - CircuitBreaker
    - Resolvers
---

# CircuitBreaker provider resolver classes

## pro

The `CircuitBreakerFactoryResolver` class provides a flexible way to configure and switch between different circuit-breaker adapters at runtime.

### Initial configuration

To begin using the `CircuitBreakerFactoryResolver`, You will need to register all required adapters during initialization.

```ts file=./circuit_breaker_factory_resolver-samples/circuit_breaker_factory_resolver_initial_config.ts
```

### Usage

#### 1. Using the default adapter

```ts file=./circuit_breaker_factory_resolver-samples/circuit_breaker_factory_resolver_default_adapter.ts
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts file=./circuit_breaker_factory_resolver-samples/circuit_breaker_factory_resolver_specific_adapter.ts
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts file=./circuit_breaker_factory_resolver-samples/circuit_breaker_factory_resolver_override_settings.ts
```

:::info
Note that the `CircuitBreakerFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## DatabaseCircuitBreakerFactoryResolver

The `DatabaseCircuitBreakerFactoryResolver` class provides a flexible way to configure and switch between different circuit-breaker-storage adapters at runtime.

### Initial configuration

To begin using the `DatabaseCircuitBreakerFactoryResolver`, You will need to register all required adapters during initialization.

```ts file=./circuit_breaker_factory_resolver-samples/database_circuit_breaker_factory_resolver_initial_config.ts
```

### Usage

#### 1. Using the default adapter

```ts file=./circuit_breaker_factory_resolver-samples/database_circuit_breaker_factory_resolver_default_adapter.ts
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts file=./circuit_breaker_factory_resolver-samples/database_circuit_breaker_factory_resolver_specific_adapter.ts
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts file=./circuit_breaker_factory_resolver-samples/database_circuit_breaker_factory_resolver_override_settings.ts
```

:::info
Note that the `DatabaseCircuitBreakerFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.

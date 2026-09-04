---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: RateLimiter resolver classes
tags:
    - RateLimiter
    - Resolvers
keywords:
    - RateLimiter
    - Resolvers
---

# RateLimiter resolver factory classes

## RateLimiterFactoryResolver

The `RateLimiterFactoryResolver` class provides a flexible way to configure and switch between different rate-limiter adapters at runtime.

### Initial configuration

To begin using the `RateLimiterFactoryResolver`, You will need to register all required adapters during initialization.

```ts file=./rate_limiter_factory_resolver-samples/rate_limiter_factory_resolver_initial_config.ts
```

### Usage

#### 1. Using the default adapter

```ts file=./rate_limiter_factory_resolver-samples/rate_limiter_factory_resolver_default_adapter.ts
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts file=./rate_limiter_factory_resolver-samples/rate_limiter_factory_resolver_specific_adapter.ts
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts file=./rate_limiter_factory_resolver-samples/rate_limiter_factory_resolver_override_settings.ts
```

:::info
Note that the `RateLimiterFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## DatabaseRateLimiterFactoryResolver

The `DatabaseRateLimiterFactoryResolver` class provides a flexible way to configure and switch between different rate-limiter-storage adapters at runtime.

### Initial configuration

To begin using the `DatabaseRateLimiterFactoryResolver`, You will need to register all required adapters during initialization.

```ts file=./rate_limiter_factory_resolver-samples/database_rate_limiter_factory_resolver_initial_config.ts
```

### Usage

#### 1. Using the default adapter

```ts file=./rate_limiter_factory_resolver-samples/database_rate_limiter_factory_resolver_default_adapter.ts
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts file=./rate_limiter_factory_resolver-samples/database_rate_limiter_factory_resolver_specific_adapter.ts
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts file=./rate_limiter_factory_resolver-samples/database_rate_limiter_factory_resolver_override_settings.ts
```

:::info
Note that the `DatabaseRateLimiterFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.

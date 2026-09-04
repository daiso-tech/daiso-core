---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Lock resolver classes
tags:
    - Lock
    - Resolver
keywords:
    - Lock
    - Resolver
---

# LockFactoryResolver

The `LockFactoryResolver` class provides a flexible way to configure and switch between different lock adapters at runtime.

## Initial configuration

To begin using the `ILockFactoryResolver`, you will need to register all required adapters during initialization.

```ts file=./lock_factory_resolver-samples/lock_factory_resolver_initial_config.ts
```

## Usage

### 1. Using the default adapter

```ts file=./lock_factory_resolver-samples/lock_factory_resolver_default_adapter.ts
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts file=./lock_factory_resolver-samples/lock_factory_resolver_specific_adapter.ts
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts file=./lock_factory_resolver-samples/lock_factory_resolver_override_settings.ts
```

:::info
Note that the `LockFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech-core/modules/Lock.html) API docs.

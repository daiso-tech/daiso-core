---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Event-bus resolver classes
tags:
    - Event-bus
    - Resolvers
keywords:
    - Event-bus
    - Resolvers
---

# EventBusResolver

The `EventBusResolver` class provides a flexible way to configure and switch between different event-bus adapters at runtime.

## Initial configuration

To begin using the `EventBusResolver` class, you will need to register all required adapters during initialization.

```ts file=./event_bus_resolver-samples/event_bus_resolver_initial_config.ts
```

## Usage

### 1. Using the default adapter

```ts file=./event_bus_resolver-samples/event_bus_resolver_default_adapter.ts
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts file=./event_bus_resolver-samples/event_bus_resolver_specific_adapter.ts
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts file=./event_bus_resolver-samples/event_bus_resolver_override_settings.ts
```

:::info
Note that the `EventBusResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.

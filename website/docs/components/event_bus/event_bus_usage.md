---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Event-bus usage
tags:
    - Event-bus
    - Usage
    - Schema
    - Validation
keywords:
    - Event-bus
    - Usage
    - Schema
    - Validation
    - eventMapSchema
---

# EventBus usage

The `eridu-tech/event-bus` component provides a way for dispatching and listening to events independent of underlying technology.

## Initial configuration

To begin using the `EventBus` class, you'll need to create and configure an instance:

```ts file=./event_bus_usage-samples/event_bus_initial_config.ts
```

:::info
Here is a complete list of settings for the [`EventBus`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.EventBusSettingsBase.html) class.
:::

## Event handling basics

### Registering Listeners and Dispatching Events

Event listeners can be added to respond to specific events:

```ts file=./event_bus_usage-samples/event_bus_listeners.ts
```

### Listener management

To properly remove a listener, you must use a named function:

```ts file=./event_bus_usage-samples/event_bus_listener_management.ts
```

## Patterns

### Compile time type safety

An event map can be used to strictly type the events:

```ts file=./event_bus_usage-samples/event_bus_type_safety.ts
```

### Runtime type safety

You can validate event data against standard-schema-compliant schemas by providing the `eventMapSchema` setting on the `EventBus`. This works with any library that implements the `StandardSchemaV1` specification, such as Zod, ArkType and Valibot.

When a schema map is provided, event data is validated:

- **On dispatch** — event data is validated against the schema for the event name before it is dispatched.
- **On listener delivery** — when `shouldValidateListeners` is `true` (the default), event data is validated before it is delivered to listeners. This ensures listeners only receive data that conforms to the schema.

If no schema is defined for a particular event name, that event is passed through without validation. If validation fails, a `ValidationError` is thrown.

```ts file=./event_bus_usage-samples/event_bus_runtime_validation.ts
```

#### Disabling listener validation

If you only want to validate event data on dispatch and skip validation when delivering to listeners, set `shouldValidateListeners` to `false`:

```ts file=./event_bus_usage-samples/event_bus_disable_listener_validation.ts
```

### Subscribe method

The subscription pattern provides automatic cleanup through an unsubscribe function:

```ts file=./event_bus_usage-samples/event_bus_subscribe.ts
```

### One-Time event handling

For listeners that should only trigger once:

```ts file=./event_bus_usage-samples/event_bus_listen_once.ts
```

You can also cancel one-time listeners before they trigger:

```ts file=./event_bus_usage-samples/event_bus_cancel_listen_once.ts
```

The `subscribeOnce` method creates a one-time listener and returns an unsubscribe function:

```ts file=./event_bus_usage-samples/event_bus_subscribe_once.ts
```

### Promise-based event handling

Wait for events using promises:

```ts file=./event_bus_usage-samples/event_bus_as_promise.ts
```

### Listening to multiple events

The `addListener`, `removeListener`, and `subscribe` methods all accept either a single event name or an array of event names, allowing you to register one listener for multiple events at once:

```ts file=./event_bus_usage-samples/event_bus_multi_events.ts
```

You can also use `subscribe` to get a single cleanup function that unsubscribes from all listed events at once:

```ts file=./event_bus_usage-samples/event_bus_subscribe_multi.ts
```

### Separating dispatching and listening

The library includes two additional contracts:

- [`IEventDispatcher`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.IEventDispatcher.html) - Allows only for event dispatching.

- [`IEventListenable`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.IEventListenable.html) - Allows only for event listening.

This separation makes it easy to visually distinguish the two contracts, making it immediately obvious that they serve different purposes.

```ts file=./event_bus_usage-samples/event_bus_contracts.ts
```

### Invocable listeners

An event listener is `Invocable` meaning you can also pass in an object (class instance or object literal) as listener:

:::info
For further information refer the [`Invocable`](../../utilities/invocable/invocable.md) docs.
:::

```ts file=./event_bus_usage-samples/event_bus_invocable_listener.ts
```

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.

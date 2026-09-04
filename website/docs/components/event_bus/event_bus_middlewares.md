---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: EventBus middlewares
tags:
    - EventBus
    - Middlewares
    - AOP
keywords:
    - EventBus
    - Middlewares
    - AOP
---

# EventBus middlewares

EventBus middlewares let you dispatch events around a wrapped function without coupling the function itself to the event bus. Each factory takes an `IEventDispatcher` (such as an `EventBus`) and returns a middleware configured with an event `type` and a `payload` invocable. The payload is resolved from the wrapped function's arguments (and, where applicable, its return value or caught error) and dispatched on the provided dispatcher, while the wrapped function's result (or thrown error) passes through unchanged. If the payload resolves to `null` (i.e. it doesn't return a value), no event is dispatched.

## withDispatchBeforeFactory middleware

The before-dispatch middleware emits an event **before** the wrapped function is invoked. When the wrapped function is called, the middleware resolves the event payload from the function's arguments, dispatches the configured event, and then invokes the wrapped function and returns its result. If the payload resolves to `null`, no event is dispatched and the wrapped function is invoked directly.

This is useful for emitting lifecycle events such as "about to create a user" or for tracing and auditing when a function starts.

### Usage

```ts file=./event_bus_middlewares-samples/with_dispatch_before.ts
```

:::info
Here is a complete list of settings for the [`withDispatchBefore`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.WithDispatchBeforeSettings.html) function.
:::

### Settings

| Option    | Type                                                                                                   | Description                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `type`    | `TEventName`                                                                                           | The event name to dispatch when the wrapped function is invoked                                                         |
| `payload` | `Invocable<[settings: WithDispatchBeforePayloadSettings<TParameters>], TEventMap[TEventName] \| void>` | An invocable that produces the event payload from the wrapped function's arguments. Returning `null` skips the dispatch |

## withDispatchAfterFactory middleware

The after-dispatch middleware emits an event **after** the wrapped function resolves. When the wrapped function completes, the middleware resolves the event payload from the function's arguments and its return value, dispatches the configured event, and then returns the wrapped function's result unchanged. If the payload resolves to `null`, no event is dispatched and the wrapped function's result is returned unchanged.

This is useful for emitting completion events such as "user created" or for recording the outcome of a function.

### Usage

```ts file=./event_bus_middlewares-samples/with_dispatch_after.ts
```

:::info
Here is a complete list of settings for the [`withDispatchAfter`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.WithDispatchAfterSettings.html) function.
:::

### Settings

| Option    | Type                                                                                                           | Description                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `TEventName`                                                                                                   | The event name to dispatch after the wrapped function resolves                                                                               |
| `payload` | `Invocable<[settings: WithDispatchAfterPayloadSettings<TParameters, TReturn>], TEventMap[TEventName] \| void>` | An invocable that produces the event payload from the wrapped function's arguments and its return value. Returning `null` skips the dispatch |

## withDispatchOnErrorFactory middleware

The on-error middleware emits an event when the wrapped function **throws**. When the wrapped function fails, the middleware resolves the event payload from the function's arguments and the caught error, dispatches the configured event, and then re-throws the original error so the failure still propagates to the caller. If the payload resolves to `null`, no event is dispatched and the original error is re-thrown as-is.

This is useful for emitting failure events such as "user creation failed" or for feeding an error-monitoring pipeline without swallowing the exception.

### Usage

```ts file=./event_bus_middlewares-samples/with_dispatch_on_error.ts
```

:::info
Here is a complete list of settings for the [`withDispatchOnError`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.WithDispatchOnErrorSettings.html) function.
:::

### Settings

| Option    | Type                                                                                                    | Description                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | `TEventName`                                                                                            | The event name to dispatch when the wrapped function throws                                                                                  |
| `payload` | `Invocable<[settings: WithDispatchOnErrorPayloadSettings<TParameters>], TEventMap[TEventName] \| void>` | An invocable that produces the event payload from the wrapped function's arguments and the caught error. Returning `null` skips the dispatch |

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.

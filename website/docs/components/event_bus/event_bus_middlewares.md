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

EventBus middlewares let you dispatch events around a wrapped function without coupling the function itself to the event bus. Each factory takes an `IEventDispatcher` (such as an `EventBus`) and returns a middleware configured with an event `type` and a `payload` invocable. The payload is resolved from the wrapped function's arguments (and, where applicable, its return value or caught error) and dispatched on the provided dispatcher, while the wrapped function's result (or thrown error) passes through unchanged.

## withDispatchBeforeFactory middleware

The before-dispatch middleware emits an event **before** the wrapped function is invoked. When the wrapped function is called, the middleware resolves the event payload from the function's arguments, dispatches the configured event, and then invokes the wrapped function and returns its result.

This is useful for emitting lifecycle events such as "about to create a user" or for tracing and auditing when a function starts.

### Usage

```ts
import { withDispatchBeforeFactory } from "eridu-tech/event-bus/middlewares";
import { EventBus } from "eridu-tech/event-bus";
import { use } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";

type EventMap = {
    "user.before.create": { userId: string };
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});
const withDispatchBefore = withDispatchBeforeFactory(eventBus);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with a "before" dispatch
const wrappedCreateUser = use(
    createUser,
    withDispatchBefore({
        type: "user.before.create",
        payload: ({ args }) => ({ userId: args[0] }),
    }),
);

await wrappedCreateUser("123");
// The "user.before.create" event is dispatched before createUser runs
```

:::info
Here is a complete list of settings for the [`withDispatchBefore`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.WithDispatchBeforeSettings.html) function.
:::

### Settings

| Option    | Type                                                                                           | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `type`    | `TEventName`                                                                                   | The event name to dispatch when the wrapped function is invoked                    |
| `payload` | `Invocable<[settings: WithDispatchBeforePayloadSettings<TParameters>], TEventMap[TEventName]>` | An invocable that produces the event payload from the wrapped function's arguments |

## withDispatchAfterFactory middleware

The after-dispatch middleware emits an event **after** the wrapped function resolves. When the wrapped function completes, the middleware resolves the event payload from the function's arguments and its return value, dispatches the configured event, and then returns the wrapped function's result unchanged.

This is useful for emitting completion events such as "user created" or for recording the outcome of a function.

### Usage

```ts
import { withDispatchAfterFactory } from "eridu-tech/event-bus/middlewares";
import { EventBus } from "eridu-tech/event-bus";
import { use } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";

type EventMap = {
    "user.after.create": { userId: string; name: string };
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});
const withDispatchAfter = withDispatchAfterFactory(eventBus);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with an "after" dispatch
const wrappedCreateUser = use(
    createUser,
    withDispatchAfter({
        type: "user.after.create",
        payload: ({ args, returnValue }) => ({
            userId: args[0],
            name: returnValue,
        }),
    }),
);

const name = await wrappedCreateUser("123");
// The "user.after.create" event is dispatched after createUser resolves,
// with the return value included in the payload
```

:::info
Here is a complete list of settings for the [`withDispatchAfter`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.WithDispatchAfterSettings.html) function.
:::

### Settings

| Option    | Type                                                                                                   | Description                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `type`    | `TEventName`                                                                                           | The event name to dispatch after the wrapped function resolves                                          |
| `payload` | `Invocable<[settings: WithDispatchAfterPayloadSettings<TParameters, TReturn>], TEventMap[TEventName]>` | An invocable that produces the event payload from the wrapped function's arguments and its return value |

## withDispatchOnErrorFactory middleware

The on-error middleware emits an event when the wrapped function **throws**. When the wrapped function fails, the middleware resolves the event payload from the function's arguments and the caught error, dispatches the configured event, and then re-throws the original error so the failure still propagates to the caller.

This is useful for emitting failure events such as "user creation failed" or for feeding an error-monitoring pipeline without swallowing the exception.

### Usage

```ts
import { withDispatchOnErrorFactory } from "eridu-tech/event-bus/middlewares";
import { EventBus } from "eridu-tech/event-bus";
import { use } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";

type EventMap = {
    "user.error": { userId: string; error: unknown };
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});
const withDispatchOnError = withDispatchOnErrorFactory(eventBus);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    throw new Error("boom");
};

// Wrap with an error dispatch
const wrappedCreateUser = use(
    createUser,
    withDispatchOnError({
        type: "user.error",
        payload: ({ args, error }) => ({
            userId: args[0],
            error,
        }),
    }),
);

try {
    await wrappedCreateUser("123");
} catch (error) {
    // The "user.error" event is dispatched with the caught error,
    // then the original error is re-thrown
}
```

:::info
Here is a complete list of settings for the [`withDispatchOnError`](https://eridu-tech.github.io/eridu-tech-core/types/EventBus.WithDispatchOnErrorSettings.html) function.
:::

### Settings

| Option    | Type                                                                                            | Description                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `type`    | `TEventName`                                                                                    | The event name to dispatch when the wrapped function throws                                             |
| `payload` | `Invocable<[settings: WithDispatchOnErrorPayloadSettings<TParameters>], TEventMap[TEventName]>` | An invocable that produces the event payload from the wrapped function's arguments and the caught error |

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.

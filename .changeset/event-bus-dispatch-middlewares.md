---
"eridu-tech": minor
---

Added three new dispatch middlewares to `eridu-tech/event-bus/middlewares`:

- `withDispatchBeforeFactory` — dispatches an event **before** the wrapped function is invoked.
- `withDispatchAfterFactory` — dispatches an event **after** the wrapped function resolves.
- `withDispatchOnErrorFactory` — dispatches an event when the wrapped function **throws**, then re-throws the original error.

Each factory takes an `IEventDispatcher` (such as an `EventBus`) and returns a middleware configured through a `settings` object containing the event `type` and a `payload`. The payload can be either a concrete value or an invocable that is resolved with a settings object before dispatching — `{ args }` for `withDispatchBeforeFactory`, `{ args, returnValue }` for `withDispatchAfterFactory`, and `{ args, error }` for `withDispatchOnErrorFactory`. This is useful for emitting lifecycle or failure events around a wrapped function.

### Usage

```ts
import { use } from "eridu-tech/middleware";
import {
    withDispatchBeforeFactory,
    withDispatchAfterFactory,
    withDispatchOnErrorFactory,
} from "eridu-tech/event-bus/middlewares";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
import { EventBus } from "eridu-tech/event-bus";

type EventMap = {
    "user.before.create": { userId: string };
    "user.after.create": { userId: string; name: string };
    "user.error": { userId: string; error: unknown };
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});

const withDispatchBefore = withDispatchBeforeFactory(eventBus);
const withDispatchAfter = withDispatchAfterFactory(eventBus);
const withDispatchOnError = withDispatchOnErrorFactory(eventBus);

const createUser = use(
    (userId: string) => `user-${userId}`,
    withDispatchBefore({
        type: "user.before.create",
        payload: ({ args: [userId] }) => ({ userId }),
    }),
    withDispatchAfter({
        type: "user.after.create",
        payload: ({ args: [userId], returnValue }) => ({
            userId,
            name: returnValue,
        }),
    }),
    withDispatchOnError({
        type: "user.error",
        payload: ({ args: [userId], error }) => ({
            userId,
            error,
        }),
    }),
);
```

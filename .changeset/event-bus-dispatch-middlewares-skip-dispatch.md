---
"eridu-tech": minor
---

Enhanced the event bus dispatch middlewares so you can return `undefined` or `void` from the `payload` invocable if you don't want to dispatch an event:

- Return `undefined` or `void` from the `payload` of `withDispatchBefore` to skip dispatching and invoke the wrapped function directly.
- Return `undefined` or `void` from the `payload` of `withDispatchAfter` to skip dispatching and return the wrapped function's result.
- Return `undefined` or `void` from the `payload` of `withDispatchOnError` to skip dispatching and re-throw the original error.

The `payload` type of the three middlewares is now `TEventMap[TEventName] | void`.

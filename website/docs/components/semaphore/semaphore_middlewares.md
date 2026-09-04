---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: Semaphore middlewares
tags:
    - Semaphore
    - Middlewares
    - AOP
keywords:
    - Semaphore
    - Middlewares
    - AOP
---

# Semaphore middlewares

## withSemaphoreFactory middleware

The Semaphore middleware wraps function calls with a distributed semaphore, limiting the number of concurrent executions across processes. Before executing the wrapped function, a slot is acquired on a key derived from the function's arguments. If the maximum number of concurrent slots (`limit`) has already been reached, the call waits (or fails immediately for non-blocking semaphores) until a slot becomes available.

### Usage

```ts file=./semaphore_middlewares-samples/with_semaphore.ts
```

:::info
Here is a complete list of settings for the [`withSemaphore`](https://eridu-tech.github.io/eridu-tech-core/types/Semaphore.WithSemaphoreSettings.html) function.
:::

### Settings

| Option   | Type                             | Description                                                                                                                                       |
| -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | `Invocable<TParameters, string>` | A function that produces the semaphore key from the wrapped function's arguments. All consumers using the same key share the same semaphore limit |
| `limit`  | `number`                         | Maximum number of concurrent slots (consumers) allowed for the semaphore key                                                                      |
| `slotId` | `Invocable<TParameters, string>` | Optional function that produces a unique slot identifier for the current acquisition attempt. Defaults to a UUID (`v4`)                           |
| `ttl`    | `ITimeSpan \| null`              | Time-to-live for each acquired slot. `null` means slots never expire automatically; if omitted the factory's default TTL is used                  |

## Further information

For further information refer to [`eridu-tech/semaphore`](https://eridu-tech.github.io/eridu-tech-core/modules/Semaphore.html) API docs.

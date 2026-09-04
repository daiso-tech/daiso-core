---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: Lock middlewares
tags:
    - Lock
    - Middlewares
    - AOP
keywords:
    - Lock
    - Middlewares
    - AOP
---

# Lock middlewares

## withLockFactory middleware

The Lock middleware wraps function calls with a distributed lock, ensuring mutual exclusion across processes. Before executing the wrapped function, a lock is acquired on a key derived from the function's arguments. If another process already holds the lock, the call waits (or fails immediately for non-blocking locks) until the lock is released.

### Usage

```ts file=./lock_middlewares-samples/with_lock.ts
```

:::info
Here is a complete list of settings for the [`withLock`](https://eridu-tech.github.io/eridu-tech-core/types/Lock.WithLockSettings.html) function.
:::

### Settings

| Option   | Type                             | Description                                                                                                                                                                |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | `Invocable<TParameters, string>` | A function that produces the lock key from the wrapped function's arguments. The lock is acquired on this key, ensuring mutual exclusion across processes for the same key |
| `lockId` | `Invocable<TParameters, string>` | Optional function that produces a unique identifier for the current lock acquisition attempt. Defaults to a UUID (`v4`)                                                    |
| `ttl`    | `ITimeSpan \| null`              | Time-to-live for the lock. `null` means the lock never expires automatically; if omitted the factory's default TTL is used                                                 |

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech-core/modules/Lock.html) API docs.

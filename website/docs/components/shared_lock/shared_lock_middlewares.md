---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: SharedLock middlewares
tags:
    - SharedLock
    - Middlewares
    - AOP
keywords:
    - SharedLock
    - Middlewares
    - AOP
---

# SharedLock middlewares

## withSharedLockFactory middleware

The SharedLock middleware wraps function calls with a distributed shared lock (reader-writer lock), providing concurrency control with two access modes: **Reader mode** (`"READER"`) allows multiple callers to execute the wrapped function concurrently as long as no writer holds the lock, while **Writer mode** (`"WRITER"`) grants exclusive access. Before executing the wrapped function, the appropriate lock is acquired on a key derived from the function's arguments.

### Usage

```ts file=./shared_lock_middlewares-samples/with_shared_lock.ts
```

:::info
Here is a complete list of settings for the [`withSharedLock`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.WithSharedLockFactorySettings.html) function.
:::

### Settings

| Option   | Type                             | Description                                                                                                                             |
| -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | `Invocable<TParameters, string>` | A function that produces the lock key from the wrapped function's arguments. All consumers using the same key share the same lock state |
| `when`   | `SharedLockWhenSetting`          | Whether to acquire the lock in `"READER"` or `"WRITER"` mode                                                                            |
| `limit`  | `number`                         | Maximum number of concurrent readers allowed when the lock is acquired in reader mode                                                   |
| `lockId` | `Invocable<TParameters, string>` | Optional function that produces a unique identifier for the current lock acquisition attempt. Defaults to a UUID (`v4`)                 |
| `ttl`    | `ITimeSpan \| null`              | Time-to-live for the lock. `null` means the lock never expires automatically; if omitted the factory's default TTL is used              |

## Further information

For further information refer to [`eridu-tech/shared-lock`](https://eridu-tech.github.io/eridu-tech-core/modules/SharedLock.html) API docs.

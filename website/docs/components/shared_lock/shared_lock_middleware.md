---
sidebar_position: 5
sidebar_label: Middleware
pagination_label: SharedLock middleware
tags:
    - SharedLock
    - Middlewares
    - AOP
keywords:
    - SharedLock
    - Middlewares
    - AOP
---

# SharedLock middleware

The SharedLock middleware wraps function calls with a distributed shared lock (reader-writer lock), providing concurrency control with two access modes:

- **Reader mode** (`"READER"`) — Multiple callers can execute the wrapped function concurrently. Readers share access as long as no writer holds the lock.
- **Writer mode** (`"WRITER"`) — Exclusive access. No other reader or writer can hold the lock at the same time.

This middleware is ideal for scenarios where read operations are safe to run concurrently but write operations need exclusive access, such as coordinating access to shared data structures, cached resources, or files.

## Initial setup

```ts
import { withSharedLockFactory, SHARED_LOCK_WHEN } from "@daiso-tech/core/shared-lock/middlewares";
import { SharedLockFactory } from "@daiso-tech/core/shared-lock";
import { useFactory } from "@daiso-tech/core/middleware";

const sharedLockFactory = SharedLockFactory({
    // Configure adapter (e.g. Redis)
});

const withSharedLock = withSharedLockFactory(sharedLockFactory);

const use = useFactory();
```

:::info
Here is a complete list of settings for the [`WithSharedLock`](https://daiso-tech.github.io/daiso-core/types/SharedLock.WithSharedLockFactorySettings.html) function.
:::

## Usage

```ts
const readData = async (key: string): Promise<unknown> => {
    // Safe to run concurrently with other readers
    return { data: "..." };
};

// Wrap with shared-lock in reader mode — multiple readers allowed
const safeRead = use(
    readData,
    withSharedLock({
        key: (resourceKey) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.READER,
        limit: 10, // Up to 10 concurrent readers
    }),
);

await safeRead("config");
```

## Further information

For further information refer to [`@daiso-tech/core/shared-lock`](https://daiso-tech.github.io/daiso-core/modules/SharedLock.html) API docs.

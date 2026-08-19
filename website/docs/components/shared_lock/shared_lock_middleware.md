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

# SharedLock middlewares

The SharedLock middleware wraps function calls with a distributed shared lock (reader-writer lock), providing concurrency control with two access modes: **Reader mode** (`"READER"`) allows multiple callers to execute the wrapped function concurrently as long as no writer holds the lock, while **Writer mode** (`"WRITER"`) grants exclusive access. Before executing the wrapped function, the appropriate lock is acquired on a key derived from the function's arguments.

## Usage

```ts
import {
    withSharedLockFactory,
    SHARED_LOCK_WHEN,
} from "eridu-tech/shared-lock/middlewares";
import { SharedLockFactory } from "eridu-tech/shared-lock";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

const sharedLockFactory = new SharedLockFactory({
    adapter: new MemorySharedLockAdapter(),
});
const withSharedLock = withSharedLockFactory(sharedLockFactory);

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

const writeData = async (key: string): Promise<unknown> => {
    // Safe to run concurrently as only writer
};

// Wrap with shared-lock in writer mode — only writer allowed
const safeWrite = use(
    writeData,
    withSharedLock({
        key: (resourceKey) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.WRITER,
        limit: 10,
    }),
);

await writeData("config");
```

:::info
Here is a complete list of settings for the [`withSharedLock`](https://eridu-tech.github.io/eridu-tech/types/SharedLock.WithSharedLockFactorySettings.html) function.
:::

## Further information

For further information refer to [`eridu-tech/shared-lock`](https://eridu-tech.github.io/eridu-tech/modules/SharedLock.html) API docs.

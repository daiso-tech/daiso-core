---
sidebar_position: 5
sidebar_label: Middleware
pagination_label: Lock middleware
tags:
    - Lock
    - Middlewares
    - AOP
keywords:
    - Lock
    - Middlewares
    - AOP
---

# Lock middleware

The Lock middleware wraps function calls with a distributed lock, ensuring mutual exclusion across processes. Before executing the wrapped function, a lock is acquired on a key derived from the function's arguments. If another process already holds the lock, the call waits (or fails immediately for non-blocking locks) until the lock is released.

## Usage

```ts
import { withLockFactory } from "@daiso-tech/core/lock/middlewares";
import { LockFactory } from "@daiso-tech/core/lock";
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";

const lockFactory = new LockFactory({
    adapter: new MemoryLockAdapter(),
});
const withLock = withLockFactory(lockFactory);

const processJob = async (jobId: string): Promise<void> => {
    // Critical section — only one process should execute this at a time
    await process(jobId);
};

// Wrap with distributed lock
const safeProcess = use(
    processJob,
    withLock({
        key: (jobId) => `job:${jobId}`,
    }),
);

await safeProcess("job-123"); // Acquires lock, processes, releases lock
```

:::info
Here is a complete list of settings for the [`withLock`](https://daiso-tech.github.io/daiso-core/types/Lock.WithLockSettings.html) function.
:::

## Further information

For further information refer to [`@daiso-tech/core/lock`](https://daiso-tech.github.io/daiso-core/modules/Lock.html) API docs.

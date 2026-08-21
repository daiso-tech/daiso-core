---
sidebar_position: 5
sidebar_label: Middleware
pagination_label: Semaphore middleware
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

The Semaphore middleware wraps function calls with a distributed semaphore, limiting the number of concurrent executions across processes. Before executing the wrapped function, a slot is acquired on a key derived from the function's arguments. If the maximum number of concurrent slots (`limit`) has already been reached, the call waits (or fails immediately for non-blocking semaphores) until a slot becomes available.

## Usage

```ts
import { withSemaphoreFactory } from "eridu-tech/semaphore/middlewares";
import { SemaphoreFactory } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";

const semaphoreFactory = new SemaphoreFactory({
    adapter: new MemorySemaphoreAdapter(),
});
const withSemaphore = withSemaphoreFactory(semaphoreFactory);

const processFile = async (filePath: string): Promise<void> => {
    // Process file — limited concurrency
    await process(filePath);
};

// Wrap with semaphore — max 3 concurrent file processes
const throttledProcess = use(
    processFile,
    withSemaphore({
        key: () => "file-processing",
        limit: 3,
    }),
);

// These will run up to 3 at a time
await Promise.all([
    throttledProcess("/data/file1.json"),
    throttledProcess("/data/file2.json"),
    throttledProcess("/data/file3.json"),
    throttledProcess("/data/file4.json"), // Waits for a slot
]);
```

:::info
Here is a complete list of settings for the [`withSemaphore`](https://eridu-tech.github.io/eridu-tech-core/types/Semaphore.WithSemaphoreSettings.html) function.
:::

## Further information

For further information refer to [`eridu-tech/semaphore`](https://eridu-tech.github.io/eridu-tech-core/modules/Semaphore.html) API docs.

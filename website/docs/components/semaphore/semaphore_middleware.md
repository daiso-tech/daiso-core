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

# Semaphore middleware

The Semaphore middleware wraps function calls with a distributed semaphore, limiting the number of concurrent executions across processes. Before executing the wrapped function, a slot is acquired on a key derived from the function's arguments. If the maximum number of concurrent slots (`limit`) has already been reached, the call waits (or fails immediately for non-blocking semaphores) until a slot becomes available.

This is useful for controlling concurrency for resource-limited operations, such as database connection pooling, external API throttling, or rate-limited batch processing.

## Initial setup

```ts
import { withSemaphoreFactory } from "@daiso-tech/core/semaphore/middlewares";
import { SemaphoreFactory } from "@daiso-tech/core/semaphore";
import { useFactory } from "@daiso-tech/core/middleware";

const semaphoreFactory = SemaphoreFactory({
    // Configure adapter (e.g. Redis)
});

const withSemaphore = withSemaphoreFactory(semaphoreFactory);

const use = useFactory();
```

:::info
Here is a complete list of settings for the [`WithSemaphore`](https://daiso-tech.github.io/daiso-core/types/Semaphore.WithSemaphoreSettings.html) function.
:::

## Usage

```ts
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

## Further information

For further information refer to [`@daiso-tech/core/semaphore`](https://daiso-tech.github.io/daiso-core/modules/Semaphore.html) API docs.

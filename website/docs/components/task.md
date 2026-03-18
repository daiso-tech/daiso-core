---
tags:
 - Utilities
keywords:
 - Utilities
---

# Task

The `@daiso-tech/core/task` component provides a better alternative to `Promise`.

:::info
In the future the `@daiso-tech/core/task` component will provide support for structured concurrency.
:::

## Basic usage

The `Task` class is `PromiseLike` object that behaves similarly to regular `Promise` but executes only when awaited or when manually defered with the `detach` method.

### Creating and executing

```ts
import { Task } from "@daiso-tech/core/task";

const task = new Task(async () => {
    // This will log when awaited
    console.log("2.");
    return await fetch("URL");
});

console.log("1.");
await task;
console.log("3.");
```

You can execute a `Task` without awaiting it:

```ts
import { Task } from "@daiso-tech/core/task";
import { TimeSpan } from "@daiso-tech/core/time-span";

const task = new Task(async () => {
    await Task.delay(TimeSpan.fromSeconds(1));
    console.log("2.");
    return await fetch("URL");
});

console.log("1.");
task.detach();
console.log("3.");
await Task.delay(TimeSpan.fromSeconds(2));
```

### Adding middlewares

You can add `middlewares` to a `Task`. Refer to the [`@daiso-tech/core/hooks`](./hooks.md) documentation for further information.

Through the constructor:

```ts
import { Task } from "@daiso-tech/core/task";

const task = new Task(async () => {
    return await fetch("URL");
}, [
    (args, next) => {
        console.log("Middleware 1");
        return next(...args);
    },
]);

await task;
```

Through the `pipe` method:

```ts
import { Task } from "@daiso-tech/core/task";

const task = new Task(async () => {
    return await fetch("URL");
}).pipe((args, next) => {
    console.log("Middleware 1");
    return next(...args);
});

await task;
```

Through the `pipeWhen` method:

```ts
import { Task } from "@daiso-tech/core/task";

const task = new Task(async () => {
    return await fetch("URL");
}).pipeWhen(true, (args, next) => {
    console.log("Middleware 1");
    return next(...args);
});

await task;
```
:::info
You can provide [`Task<boolean>`](./task.md), synchronous and asynchronous [`Invokable<[], boolean>`](../utilities/invokable.md) as values for `pipeWhen` method.
:::

### Static methods

`Task` provides static helper methods (`all`, `allSettled`, `race`, and `any`) that mirror their `Promise` counterparts, but with lazy execution behavior. Like individual `Task` instances, these methods only evaluate when awaited or when their `detach` method is explicitly called.

The are additional static method, `delay` and `fromCallback`.

-   The `delay` method creates a `Task` that resolves after a given time:

    ```ts
    import { Task } from "@daiso-tech/core/task";
    import { TimeSpan } from "@daiso-tech/core/time-span";

    // Will wait 1 second
    await Task.delay(TimeSpan.fromSeconds(1));
    console.log("DONE");
    ```

    You can provide an `AbortSignal` to abort the delay:

    ```ts
    import { Task } from "@daiso-tech/core/task";
    import { TimeSpan } from "@daiso-tech/core/time-span";

    const abortController = new AbortController();
    abortController.abort("No need to wait");

    // Will not wait for the delay
    await Task.delay(TimeSpan.fromSeconds(1), abortController.signal);
    console.log("DONE");
    ```

-   The `fromCallback` is convience method used for wrapping Node js callback functions with a `Task`.

    ```ts
    import { Task } from "@daiso-tech/core/task";
    import { readFile } from "node:fs";

    const task = Task.fromCallback<Buffer | string>((resolve, reject) => {
        readFile("FILE_PATH", (err, data) => {
            if (err !== null) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
    const file = await task;
    console.log(file);
    ```


## Further information

For further information refer to [`@daiso-tech/core/task`](https://daiso-tech.github.io/daiso-core/modules/Task.html) API docs.

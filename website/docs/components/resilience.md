---
tags:
 - Utilities
keywords:
 - Utilities
---

# Resilience

The `@daiso-tech/core/resilience` component provides predefined fault tolerant `middlewares`.

:::info
For further information about `middlewares` refer to [`@daiso-tech/core/hooks`](./hooks.md) documentation.
:::

## Fallback

The `fallback` middleware adds fallback value when an error occurs:

### Usage

```ts
import { fallback } from "@daiso-tech/core/resilience";
import { AsyncHooks } from "@daiso-tech/core/hooks";

function unstableFn(): number {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = new AsyncHooks(unstableFn, [
    fallback({
        fallbackValue: 1,
    }),
]);

// Will never throw and when error occurs the fallback value will be returned.
console.log(await fn.invoke());
```

:::info
You can provide [`Task<TValue>`](./task.md), synchronous and asynchronous [`Invokable<TValue, []>`](../utilities/invokable.md) as fallback value.
:::

### Custom ErrorPolicy

You can define an [`ErrorPolicy`](../utilities/error_policy_type.md) to specify fallback values for specific error cases:

```ts
const fn = new AsyncHooks(unstableFn, [
    fallback({
        fallbackValue: 1,
        // Will only fallback errors that are not a TypeError
        errorPolicy: (error) => !(error instanceof TypeError),
    }),
]);
```

### Callbacks

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before the fallback value is returned.

```ts
const fn = new AsyncHooks(unstableFn, [
    fallback({
        fallbackValue: 1,
        onFallback: (fallbackData) => console.log(fallbackData),
    }),
]);
```

:::info
For more details about `onFallback` callback data, see the OnFallbackData type.
:::

## Retry

The `retry` middleware enables automatic retries for all errors or specific errors, with configurable backoff policies. An error will be thrown when all retry attempts fail.

### Usage

```ts
import { retry } from "@daiso-tech/core/resilience";
import { AsyncHooks } from "@daiso-tech/core/hooks";

function unstableFn(): number {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = new AsyncHooks(unstableFn, [
    retry({
        // Will retry 4 times
        maxAttempts: 4,
    }),
]);

await fn.invoke();
```

### Custom ErrorPolicy

You can define an [`ErrorPolicy`](../utilities/error_policy_type.md) to retry specific error cases:

```ts
const fn = new AsyncHooks(unstableFn, [
    retry({
        maxAttempts: 4,
        // Will only retry errors that are not TypeError
        errorPolicy: (error) => !(error instanceof TypeError),
    }),
]);
```

### Custom BackoffPolicy

You can use custom [`BackoffPolicy`](./backoff_policies.md):

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const fn = new AsyncHooks(unstableFn, [
    retry({
        maxAttempts: 4,
        // By default a exponential policy is used
        backoffPolicy: (attempt: number, _error: unknown) =>
            TimeSpan.fromMilliseconds(attempt * 100),
    }),
]);
```

### Callbacks

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before execution attempt:

```ts
const fn = new AsyncHooks(unstableFn, [
    retry({
        maxAttempts: 4,
        onExecutionAttempt: (data) => console.log(data),
    }),
]);
```

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before the retry delay starts:

:::info
For more details about `onExecutionAttempt` callback data, see the `OnRetryAttemptData` type.
:::

```ts
const fn = new AsyncHooks(unstableFn, [
    retry({
        maxAttempts: 4,
        onRetryDelay: (data) => console.log(data),
    }),
]);
```

:::info
For more details about `onRetryDelay` callback data, see the `OnRetryDelayData` type.
:::

## Timeout

The `timeout` middleware automatically aborts functions after a specified time period, throwing an error when aborted.

### Usage

```ts
import { timeout } from "@daiso-tech/core/resilience";
import { AsyncHooks } from "@daiso-tech/core/hooks";
import { TimeSpan } from "@daiso-tech/core/time-span";

function fetchData(): Promise<Response> {
    const response = await fetch("ENDPOINT");
    console.log("DONE");
    return response;
}
const fn = new AsyncHooks(fetchData, [
    timeout({
        waitTime: TimeSpan.fromSeconds(2),
    }),
]);

await fn.invoke();
```

:::warning
Note when a timeout occurs, the function call continues executing in the background and only the `Promise` will be aborted.
To ensure correct abortion behavior, provide an `AbortSignalBinder` to `AsyncHooks`.

For further information about `AbortSignalBinder` and `AsyncHooks` refer to [`@daiso-tech/core/hooks`](./hooks.md) documentation.

```ts
import { timeout } from "@daiso-tech/core/resilience";
import { TimeSpan } from "@daiso-tech/core/time-span";
import { AsyncHooks } from "@daiso-tech/core/hooks";

function fetchData(signal?: AbortSignal): Promise<Response> {
    const response = await fetch("ENDPOINT", {
        signal,
    });
    console.log("DONE");
    return response;
}
const fn = new AsyncHooks(
    fetchData,
    [
        timeout({
            waitTime: TimeSpan.fromSeconds(2),
        }),
    ],
    {
        signalBinder: {
            getSignal: (args) => args[0],
            forwardSignal: (args, signal) => {
                args[0] = signal;
            },
        },
    },
);

await fn.invoke();
```

:::

### Callbacks

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before the timeout occurs.

```ts
const fn = new AsyncHooks(
    fetchData,
    [
        timeout({
            waitTime: TimeSpan.fromSeconds(2),
            onTimeout: (data) => console.log(data),
        }),
    ],
    {
        signalBinder: {
            getSignal: (args) => args[0],
            forwardSignal: (args, signal) => {
                args[0] = signal;
            },
        },
    },
);
```

:::info
For more details about `onTimeout` callback data, see the `OnTimeoutData` type.
:::

## Observe

The `observe` middleware tracks an async function's state and runs callbacks when it fails with an error or succeeds:

### Usage

```ts
import { observe } from "@daiso-tech/core/resilience";
import { AsyncHooks } from "@daiso-tech/core/hooks";

function unstableFn(): Promise<number> {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = new AsyncHooks(unstableFn, [
    observe({
        onStart: (data) => console.log("START:", data),
        onSuccess: (data) => console.log("SUCCESS:", data),
        onError: (data) => console.error("ERROR:", data),
        onFinally: (data) => console.log("END:", data),
    }),
]);

await fn.invoke();
```

:::info

- For more details about `onStart` callback data, see the `OnObserveStartData` type.

- For more details about `onSuccess` callback data, see the `OnObserveSuccessData` type.

- For more details about `onError` callback data, see the `OnObserveErrorData` type.

- For more details about `onFinally` callback data, see the `OnObserveFinallyData` type.

:::

## Further information

For further information refer to [`@daiso-tech/core/resilience`](https://daiso-tech.github.io/daiso-core/modules/Resilience.html) API docs.

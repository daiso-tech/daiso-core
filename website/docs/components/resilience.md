---
tags:
 - Utilities
keywords:
 - Utilities
---

# Resilience

The `@daiso-tech/core/resilience` component provides predefined fault tolerant `middlewares`.

:::info
For further information about `middlewares` refer to [`@daiso-tech/core/middleware`](./middleware.md) documentation.
:::

## Fallback

The `fallback` middleware adds fallback value when an error occurs:

### Usage

```ts
import { fallback } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();

function unstableFn(): number {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = use(unstableFn, [
    fallback({
        fallbackValue: 1,
    }),
]);

// Will never throw and when error occurs the fallback value will be returned.
console.log(await fn());
```

:::info
You can provide synchronous and asynchronous [`Invokable<[], Promiseable<TValue>>`](../utilities/invokable.md) as fallback value.
:::

### Custom ErrorPolicy

You can define an [`ErrorPolicy`](../utilities/error_policy_type.md) to specify fallback values for specific error cases:

```ts
const fn = use(unstableFn, [
    fallback({
        fallbackValue: 1,
        // Will only fallback errors that are not a TypeError
        errorPolicy: (error) => !(error instanceof TypeError),
    }),
]);

await fn();
```

### Callbacks

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before the fallback value is returned.

```ts
const fn = use(unstableFn, [
    fallback({
        fallbackValue: 1,
        onFallback: (fallbackData) => console.log(fallbackData),
    }),
]);

await fn();
```

:::info
For more details about `onFallback` callback data, see the OnFallbackData type.
:::

## Retry

The `retry` middleware enables automatic retries for all errors or specific errors, with configurable backoff policies. An error will be thrown when all retry attempts fail.

### Usage

```ts
import { retry } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();

function unstableFn(): number {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = use(unstableFn, [
    retry({
        // Will retry 4 times
        maxAttempts: 4,
    }),
]);

await fn();
```

### Custom ErrorPolicy

You can define an [`ErrorPolicy`](../utilities/error_policy_type.md) to retry specific error cases:

```ts
const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        // Will only retry errors that are not TypeError
        errorPolicy: (error) => !(error instanceof TypeError),
    }),
]);

await fn();
```

### Custom BackoffPolicy

You can use custom [`BackoffPolicy`](./backoff_policies.md):

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        // By default a exponential policy is used
        backoffPolicy: (attempt: number, _error: unknown) =>
            TimeSpan.fromMilliseconds(attempt * 100),
    }),
]);

await fn();
```

### Callbacks

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before execution attempt:

```ts
const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        onExecutionAttempt: (data) => console.log(data),
    }),
]);

await fn();
```

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before the retry delay starts:

:::info
For more details about `onExecutionAttempt` callback data, see the `OnRetryAttemptData` type.
:::

```ts
const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        onRetryDelay: (data) => console.log(data),
    }),
]);

await fn();
```

:::info
For more details about `onRetryDelay` callback data, see the `OnRetryDelayData` type.
:::

## Timeout

The `timeout` middleware automatically aborts functions after a specified time period, throwing an error when aborted.

### Usage

```ts
import { timeout } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";
import { TimeSpan } from "@daiso-tech/core/time-span";

const use = useFactory();

async function fetchData(): Promise<Response> {
    const response = await fetch("ENDPOINT");
    console.log("DONE");
    return response;
}
const fn = use(fetchData, [
    timeout({
        waitTime: TimeSpan.fromSeconds(2),
    }),
]);

await fn();
```

### Callbacks

You can add callback [`Invokable`](../utilities/invokable.md) that will be called before the timeout occurs.

```ts
const fn = use(
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

await fn();
```

:::info
For more details about `onTimeout` callback data, see the `OnTimeoutData` type.
:::

## Observe

The `observe` middleware tracks an async function's state and runs callbacks when it fails with an error or succeeds:

### Usage

```ts
import { observe } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();

function unstableFn(): Promise<number> {
    // We simulate a function that can throw unexpected errors
    if (Math.round(Math.random() * 1.5) === 0) {
        throw new Error("Unexpected error occurred");
    }
    return Math.round((Math.random() + 1) * 99);
}
const fn = use(unstableFn, [
    observe({
        onStart: (data) => console.log("START:", data),
        onSuccess: (data) => console.log("SUCCESS:", data),
        onError: (data) => console.error("ERROR:", data),
        onFinally: (data) => console.log("END:", data),
    }),
]);

await fn();
```

:::info

- For more details about `onStart` callback data, see the `OnObserveStartData` type.

- For more details about `onSuccess` callback data, see the `OnObserveSuccessData` type.

- For more details about `onError` callback data, see the `OnObserveErrorData` type.

- For more details about `onFinally` callback data, see the `OnObserveFinallyData` type.

:::

## Further information

For further information refer to [`@daiso-tech/core/resilience`](https://daiso-tech.github.io/daiso-core/modules/Resilience.html) API docs.

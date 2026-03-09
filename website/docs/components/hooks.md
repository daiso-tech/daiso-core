---
tags:
 - Utilities
keywords:
 - Utilities
---

# Hooks

The `@daiso-tech/core/hooks` component provides seamless way to add middlewares/hooks to any sync and async functions without any hassle.

## Synchronous hooks

The `Hooks` class provides a convenient way to change and inspect arguments and return value of synchronous functions.

### Creating middlewares

In order to use the `Hooks` class we need to create `middlewares`:

```ts
// file: middlewares.ts
import type { MiddlewareFn } from "@daiso-tech/core/hooks";

// Creating function that returns a middleware that will log the arguments and return value.
export function log<TParameters extends unknown[], TReturn>(): MiddlewareFn<
    TParameters,
    TReturn,
    { funcName: string }
> {
    return (args, next, { name: funcName }) => {
        console.log("FUNCTION_NAME:", funcName);
        console.log("ARGUMENTS:", args);
        const value = next(...args);
        console.log("RETURN:", value);
        return value;
    };
}

// Creating function that returns a middleware that will log the execution time.
export function time<TParameters extends unknown[], TReturn>(): MiddlewareFn<
    TParameters,
    TReturn
> {
    return (args, next) => {
        const start = performance.now();
        const value = next(...args);
        const end = performance.now();
        const time = end - start;
        console.log("TIME:", `${String(time)}ms`);
        return value;
    };
}
```

:::info
Note each middleware receives the passed arguments, the next function to execute and the function name. The middleware must then return a value.
:::

### Using middlewares

Now we need to apply the middlewares to a function:

```ts
// file: main.ts
import { Hooks } from "@daiso-tech/core/hooks";
import { log, time } from "./middlewares.js";

function add(a: number, b: number): number {
    return a + b;
}

// Applying the middleware on the add function
const enhancedAdd = new Hooks(add, [log(), time()]);

// Will log the function name, arguments, return value and execution time.
const result = enhancedAdd.invoke(1, 2);

// Will be 3.
console.log(result);
```

:::info
Note middlewares apply left to right: each wraps the next, with the leftmost being the outermost layer and the rightmost wrapping the original function.
:::

:::info
Note the middlewares are reusable and can be applied to other functions:

```ts
// file: main.ts
import { Hooks } from "@daiso-tech/core/hooks";
import { log, time } from "./middlewares.js";

function average(...nbrs: number[]): number {
    let average = 0;
    for (const nbr of nbrs) {
        average += nbr;
    }
    return average / nbr.length;
}

const enhancedAverage = new Hooks(average, [log(), time()]);
```

:::

### Setting function name

If you use an anonymous function, you must set its name manually; otherwise, it will default to 'func'.

```ts
import { Hook } from "@daiso-tech/core/hooks";

const enhancedAdd = new Hooks(
    (a: number, b: number): number => a + b,
    [
        (args, next, { name: funcName }) => {
            console.log(funcName);
            return next(...args);
        },
    ],
    {
        name: "add",
    },
);
```

### Providing additional context

The middleware supports custom context, allowing you to pass any relevant information.

```ts
import { Hook, type MiddlewareFn } from "@daiso-tech/core/hooks";

function add(a: number, b: number): number {
    return a + b;
}

type MiddlewareContext = {
    a: number;
    b: number;
    c: number;
};

function createMiddleware<
    TParameters extends unknown[],
    TReturn,
>(): MiddlewareFn<TParameters, TReturn, MiddlewareContext> {
    return (args, next, { context }) => {
        // Will print { a: 1, b: 2, c: 3 }
        console.log(context);
        return next(...args);
    };
}

const enhancedAdd = new Hooks(add, [createMiddleware()], {
    // You provide context here
    context: {
        a: 1,
        b: 2,
        c: 3,
    },
});
```

### Converting to a function

You can convert `Hooks` to a reguler function.

```ts
import { Hook } from "@daiso-tech/core/hooks";

// add is now a function and not Hook instance
const add = new Hooks(
    (a: number, b: number): number => a + b,
    [
        (args, next) => {
            console.log("Middleware applied");
            return next(...args);
        },
    ],
    {
        name: "add",
    },
).toFunc();
```

### Deriving Hook instances

You can derive a new `Hooks` instance from another instance.

```ts
import { Hook } from "@daiso-tech/core/hooks";

const addA = new Hooks(
    (a: number, b: number): number => a + b,
    [
        (args, next) => {
            console.log("Middleware A applied");
            return next(...args);
        },
    ],
    {
        name: "add",
    },
);

// Will include middleware A and B
const addB = addA.pipe((args, next) => {
    console.log("Middleware B applied");
    return next(...args);
});

// Will only apply the middleware if the statement is true
// If the statement is true then middleware A, B and C will be included
// If the statement is false then only middleware A and B will be included
const addC = addA.pipeWhen(false, (args, next) => {
    console.log("Middleware C applied");
    return next(...args);
});
```
:::info
You can provide `Task<boolean>`, synchronous and asynchronous `Invokable<[], boolean>` as values for `pipeWhen` method.
:::

:::info
Note that the `Hooks` class is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Asynchronous hooks

The `AsyncHooks` class is similar to Hooks, but it works with both asynchronous and synchronous functions. Unlike `Hooks`, this class always returns a `Promise`.

### Usage

```ts
import { AsyncHooks } from "@daiso-tech/core/hooks";

// Works with synchronous function
const add1 = new AsyncHooks(
    (a: number, b: number): number => a + b,
    [
        async (args, next) => {
            console.log("Middleware applied");
            return await next(...args);
        },
    ],
    {
        name: "add",
    },
);

// Works with asynchronous function
const add2 = new AsyncHooks(
    async (a: number, b: number): Promise<number> => a + b,
    [
        async (args, next) => {
            console.log("Middleware applied");
            return await next(...args);
        },
    ],
    {
        name: "add",
    },
);
```

### Binding AbortSignal

By binding an `AbortSignal` via `AbortSignalBinder`, both the middleware and the function gain mutual cancellation control, provided the function handles `AbortSignal`.

```ts
import { AsyncHooks, type AsyncMiddlewareFn } from "@daiso-tech/core/hooks";

async function fetchData(url: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(url, { signal });
    return await response.json();
}

const fetchDataSignalBinder: AbortSignalBinder<Parameters<typeof fetchData>> = {
    // Return the signal that is passed to arguments or null
    getSignal: (args) => args[1],
    // Replace the argument where the signal is passed
    // with a signal that will be aborted from the middleware or the function
    forwardSignal: (args, signal) => {
        args[1] = signal;
    },
};

function timeout<TParameters extends unknown[], TReturn>(
    repetition: number,
): AsyncMiddlewareFn<TParameters, TReturn> {
    return async (args, next, { abort, signal }) => {
        // We check if the function is already aborted
        // then will throw early
        if (signal.aborted) {
            throw signal.reason;
        }

        // We abort the function when it exceeds 2 seconds.
        const id = setTimeout(() => abort("Timed out"), 2000);
        const clear = () => clearTimeout(id);
        try {
            // We clear the timeout if function is aborted before it exceeds 2 seconds.
            signal.addEventListener("abort", clear, {
                once: true,
            });
            return await next(...args);
        } finally {
            // We do cleanup work

            // Remove the listener
            signal.removeEventListener("abort", clear);
            // Clear the timeout
            clear();
        }
    };
}

const fetchDataEnhanced = new AsyncHooks(fetchData, [timeout()], {
    signalBinder: fetchDataSignalBinder,
});
```

## Further information

For further information refer to [`@daiso-tech/core/hooks`](https://daiso-tech.github.io/daiso-core/modules/Hooks.html) API docs.

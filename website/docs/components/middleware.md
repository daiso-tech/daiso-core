---
pagination_label: Middleware usage
tags:
 - Middleware
 - Utilities
keywords:
 - Middleware
 - Function Interception
 - Middleware Pipeline
---

# Middleware

The `@daiso-tech/core/middleware` module provides a flexible middleware system for intercepting and composing function calls. It enables you to wrap functions with pre-processing and post-processing logic, similar to middleware patterns found in web frameworks like Express.js.

## Initial configuration

To begin using middleware, create a middleware application function using the factory:

```ts
import { useFactory } from "@daiso-tech/core/middleware";
import { ExecutionContext } from "@daiso-tech/core/execution-context";
import { AlsExecutionContextAdapter } from "@daiso-tech/core/execution-context/als-execution-context-adapter";

// Create a middleware function with a specific execution context
const use = useFactory({
    executionContext: new ExecutionContext(new AlsExecutionContextAdapter()),
    defaultPriority: 0,
});
```

Or use the default configuration:

```ts
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();
```

## Middleware basics

### Creating a simple middleware

A middleware is a function that receives middleware arguments (containing the original arguments, a next function, and the execution context) and returns the result:

```ts
import { type MiddlewareFn, type MiddlewareArgs } from "@daiso-tech/core/middleware";

const createLoggingMiddleware = (prefix: string = "LOG"): MiddlewareFn<unknown[], unknown> => {
    return ({ args, next, context }: MiddlewareArgs<unknown[], unknown>) => {
        console.log(`${prefix} - Before invocation with args:`, args);
        const result = next(args);
        console.log(`${prefix} - After invocation, result:`, result);
        return result;
    };
};

const loggingMiddleware = createLoggingMiddleware();
```

### Applying middleware to a function

Use the `use` function to apply one or more middlewares to a function:

```ts
const originalFn = (name: string, age: number): string => {
    return `${name} is ${age} years old`;
};

const wrappedFn = use(originalFn, loggingMiddleware);

// Call the wrapped function
const result = wrappedFn("Alice", 30);
// Logs: "Before invocation with args: ["Alice", 30]"
// Logs: "After invocation, result: Alice is 30 years old"
```

### Applying multiple middlewares

You can apply multiple middlewares, which are executed in order of their priority:

```ts
const createValidationMiddleware = (): MiddlewareFn<[string, number], string> => {
    return ({ args, next, context }: MiddlewareArgs<[string, number], string>) => {
        const [name, age] = args;
        if (age < 0) throw new Error("Age cannot be negative");
        return next(args);
    };
};

const createAuthMiddleware = (): MiddlewareFn<[string, number], string> => {
    return ({ args, next, context }: MiddlewareArgs<[string, number], string>) => {
        console.log("Checking authorization...");
        return next(args);
    };
};

const validationMiddleware = createValidationMiddleware();
const authMiddleware = createAuthMiddleware();

const wrappedFn = use(originalFn, [
    loggingMiddleware,
    validationMiddleware,
    authMiddleware,
]);
```

## Middleware types

### MiddlewareFn

A function that receives middleware arguments and returns a result:

```ts
type MiddlewareFn<TParameters, TReturn> = (
    args: MiddlewareArgs<TParameters, TReturn>
) => TReturn;
```

### IMiddlewareObject

A middleware object with an optional priority property:

```ts
class AuthMiddleware implements IMiddlewareObject<[string, number], string> {
    constructor(public readonly priority: number = 100) {}

    invoke({ args, next, context }: MiddlewareArgs<[string, number], string>): string {
        // Authentication logic
        return next(args);
    }
}

const authMiddleware = new AuthMiddleware(100);
const wrappedFn = use(originalFn, authMiddleware);
```

### MiddlewareArgs

The argument passed to each middleware:

```ts
type MiddlewareArgs<TParameters, TReturn> = {
    // Original function arguments
    args: TParameters;           
    // Function to invoke next middleware or original function
    next: NextFn<TParameters, TReturn>;
    // Execution context for storing request-scoped data
    context: IContext;
};
```

## Patterns

### Priority-based ordering

Set priority on middleware objects to control execution order (lower numbers execute first):

```ts
const createPriorityMiddleware = (name: string, priority: number): IMiddlewareObject<[string], string> => ({
    priority,
    invoke: ({ args, next }: MiddlewareArgs<[string], string>): string => {
        console.log(`${priority}. ${name}`);
        return next(args);
    },
});

const authMiddleware = createPriorityMiddleware("Auth", 10);
const validationMiddleware = createPriorityMiddleware("Validation", 20);
const loggingMiddleware = createPriorityMiddleware("Logging", 30);

const wrappedFn = use((value: string): string => value.toUpperCase(), [
    loggingMiddleware,
    validationMiddleware,
    authMiddleware,
]);

// Executes in order: Auth -> Validation -> Logging -> Original function
```

### Using execution context

Access and modify the execution context within middleware. For more details about the execution context module, see [Execution Context](./execution-context.md).

```ts
import { contextToken } from "@daiso-tech/core/execution-context";
import { Namespace } from "@daiso-tech/core/namespace";

const namespace = new Namespace("myapp");
type UserData = { id: string; name: string };
const userToken = contextToken<UserData>(namespace.create("user").toString());

const createContextAwareMiddleware = (defaultUser: UserData): MiddlewareFn<[string, number], string> => {
    return ({ args, next, context }: MiddlewareArgs<[string, number], string>) => {
        const user = context.getOr(userToken, defaultUser);
        console.log("Executing as:", user.name);
        return next(args);
    };
};

const contextAwareMiddleware = createContextAwareMiddleware({ id: "anonymous", name: "Guest" });
const wrappedFn = use(originalFn, contextAwareMiddleware);
```

### Async middleware

Middleware can be asynchronous:

```ts
const createAsyncValidationMiddleware = (validator: (args: [string, number]) => Promise<boolean>): MiddlewareFn<[string, number], Promise<string>> => {
    return async ({ args, next, context }: MiddlewareArgs<[string, number], Promise<string>>): Promise<string> => {
        // Perform async validation
        const isValid = await validator(args);
        if (!isValid) throw new Error("Validation failed");
        return await next(args);
    };
};

const asyncValidationMiddleware = createAsyncValidationMiddleware(validateAsync);
const wrappedFn = use(originalFn, asyncValidationMiddleware);
```

### Short-circuiting middleware

Skip calling `next()` to bypass subsequent middleware and the original function:

```ts
const createCachingMiddleware = <T extends unknown[]>(cacheStore: Map<string, unknown> = new Map()): MiddlewareFn<T, unknown> => {
    return ({ args, next, context }: MiddlewareArgs<T, unknown>) => {
        const cacheKey: string = JSON.stringify(args);

        if (cacheStore.has(cacheKey)) {
            console.log("Cache hit!");
            return cacheStore.get(cacheKey); // Skip next()
        }

        const result = next(args);
        cacheStore.set(cacheKey, result);
        return result;
    };
};

const cache = new Map<string, unknown>();
const cachingMiddleware = createCachingMiddleware(cache);
```

### Error handling middleware

Catch and handle errors in middleware:

```ts
const createErrorHandlingMiddleware = (errorHandler?: (error: unknown) => void): MiddlewareFn<[string, number], Promise<string>> => {
    return async ({ args, next, context }: MiddlewareArgs<[string, number], Promise<string>>): Promise<string> => {
        try {
            return await next(args);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error occurred:", message);
            if (errorHandler) errorHandler(error);
            throw error;
        }
    };
};

const errorHandlingMiddleware = createErrorHandlingMiddleware(
    (error) => console.log("Error handled gracefully")
);
```

## UseFactory configuration

Configure the middleware factory with custom settings:

```ts
type UseFactorySettings = {
    /**
     * The execution context to use for all middleware invocations.
     * Defaults to a new ExecutionContext with NoOpExecutionContextAdapter
     */
    executionContext?: IExecutionContext;

    /**
     * Default priority for middleware without an explicit priority.
     * Defaults to 0
     */
    defaultPriority?: number;
};

const use = useFactory({
    executionContext: customContext,
    defaultPriority: 50,
});
```

## Further information

For further information refer to [`@daiso-tech/core/middleware`](https://daiso-tech.github.io/daiso-core/modules/Middleware.html) API docs.
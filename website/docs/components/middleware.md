pagination_label: Middleware usage
tags: - Middleware - Utilities
keywords: - Middleware - Function Interception - Middleware Pipeline

# Middleware

The `@daiso-tech/core/middleware` module provides a flexible middleware system for intercepting and composing function calls. It enables you to wrap functions with pre-processing and post-processing logic, similar to middleware patterns found in web frameworks like Express.js.

## UseFactory configuration

## Initial configuration

To begin using middleware, create a middleware application function using the factory:

```ts
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory({
    defaultPriority: 0,
});
```

Or use the default configuration:

```ts
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();
```

Configure the middleware factory with custom settings:

```ts
type UseFactorySettings = {
    /**
     * Default priority for middleware without an explicit priority.
     * Defaults to 0
     */
    defaultPriority?: number;
};

const use = useFactory({
    defaultPriority: 50,
});
```

## Middleware basics

### Creating a simple middleware

A middleware is a function that receives middleware arguments (containing the original arguments, a next function, and the name of the function) and returns the result:

```ts
import { type MiddlewareArgs } from "@daiso-tech/core/middleware";
import { type MiddlewareFn } from "@daiso-tech/core/middleware/contracts";

const createLoggingMiddleware = <TParameters extends Array<unknown>, TReturn>(
    prefix: string = "LOG",
): MiddlewareFn<TParameters, TReturn> => {
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
const createValidationMiddleware = (): MiddlewareFn<
    [string, number],
    string
> => {
    return ({
        args,
        next,
        context,
    }: MiddlewareArgs<[string, number], string>) => {
        const [name, age] = args;
        if (age < 0) throw new Error("Age cannot be negative");
        return next(args);
    };
};

const createAuthMiddleware = (): MiddlewareFn<[string, number], string> => {
    return ({
        args,
        next,
        context,
    }: MiddlewareArgs<[string, number], string>) => {
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
    args: MiddlewareArgs<TParameters, TReturn>,
) => TReturn;
```

### IMiddlewareObject

A middleware object with an optional priority property:

```ts
class AuthMiddleware implements IMiddlewareObject<[string, number], string> {
    constructor(public readonly priority: number = 100) {}

    invoke({
        args,
        next,
        context,
    }: MiddlewareArgs<[string, number], string>): string {
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

    // name of the function/method
    name: string;
};
```

## Patterns

### Priority-based ordering

Set priority on middleware objects to control execution order (lower numbers execute first):

```ts
const createPriorityMiddleware = (
    name: string,
    priority: number,
): IMiddlewareObject<[string], string> => ({
    priority,
    invoke: ({ args, next }: MiddlewareArgs<[string], string>): string => {
        console.log(`${priority}. ${name}`);
        return next(args);
    },
});

const authMiddleware = createPriorityMiddleware("Auth", 10);
const validationMiddleware = createPriorityMiddleware("Validation", 20);
const loggingMiddleware = createPriorityMiddleware("Logging", 30);

const wrappedFn = use(
    (value: string): string => value.toUpperCase(),
    [loggingMiddleware, validationMiddleware, authMiddleware],
);

// Executes in order: Auth -> Validation -> Logging -> Original function
```

### Async middleware

Middleware can be asynchronous:

```ts
const createAsyncValidationMiddleware = (
    validator: (args: [string, number]) => Promise<boolean>,
): MiddlewareFn<[string, number], Promise<string>> => {
    return async ({
        args,
        next,
        context,
    }: MiddlewareArgs<[string, number], Promise<string>>): Promise<string> => {
        // Perform async validation
        const isValid = await validator(args);
        if (!isValid) throw new Error("Validation failed");
        return await next(args);
    };
};

const asyncValidationMiddleware =
    createAsyncValidationMiddleware(validateAsync);
const wrappedFn = use(originalFn, asyncValidationMiddleware);
```

### Short-circuiting middleware

Skip calling `next()` to bypass subsequent middleware and the original function:

```ts
const createCachingMiddleware = <T extends unknown[]>(
    cacheStore: Map<string, unknown> = new Map(),
): MiddlewareFn<T, unknown> => {
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
const createErrorHandlingMiddleware = (
    errorHandler?: (error: unknown) => void,
): MiddlewareFn<[string, number], Promise<string>> => {
    return async ({
        args,
        next,
        context,
    }: MiddlewareArgs<[string, number], Promise<string>>): Promise<string> => {
        try {
            return await next(args);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            console.error("Error occurred:", message);
            if (errorHandler) errorHandler(error);
            throw error;
        }
    };
};

const errorHandlingMiddleware = createErrorHandlingMiddleware((error) =>
    console.log("Error handled gracefully"),
);
```

### Enhancing Methods with `enhanceFactory`

The `enhanceFactory` function provides a convenient way to apply middleware to methods of class instances, enabling interception and augmentation of method calls without manually wrapping each function.

#### Purpose

`enhanceFactory` is a higher-order factory that, given a `use` function (created by `useFactory`), returns an `enhance` function. This `enhance` function can be used to dynamically enhance (wrap) a method of an object with one or more middlewares.

#### Signature

```ts
function enhanceFactory(use: Use): Enhance;
```

#### Usage Example

```ts
import { useFactory, enhanceFactory } from "@daiso-tech/core/middleware";

// Create a middleware application function
const use = useFactory();
const enhance = enhanceFactory(use);

class Greeter {
    greet(name: string): string {
        return `Hello, ${name}!`;
    }
}

const greeter = new Greeter();

// Example middleware that logs calls
function loggingMiddleware<
    TParameters extends Array<unknown>,
    TReturn,
>(): MiddlewareFn<TParameters, TReturn> {
    return ({ args, next }) => {
        console.log("Calling greet with:", args);
        const result = next(args);
        console.log("Result:", result);
        return result;
    };
}

// Enhance the 'greet' method with middleware
enhance(greeter, "greet", loggingMiddleware());

greeter.greet("Alice");
// Logs:
// Calling greet with: ["Alice"]
// Result: Hello, Alice!
```

#### Enhancing Object Literal Methods

You can enhance methods on plain object literals as well:

```ts
const obj = {
    add(a: number, b: number) {
        return a + b;
    },
};

enhance(obj, "add", loggingMiddleware());
obj.add(2, 3);
// Logs:
// Calling greet with: [2, 3]
// Result: 5
```

#### Enhancing Static Methods

Static methods on classes can also be enhanced:

```ts
class MathUtils {
    static multiply(a: number, b: number) {
        return a * b;
    }
}

enhance(MathUtils, "multiply", loggingMiddleware());
MathUtils.multiply(4, 5);
// Logs:
// Calling greet with: [4, 5]
// Result: 20
```

#### Enhancing Class Prototype Methods

You can enhance all instances of a class by enhancing its prototype:

```ts
class Person {
    say(message: string) {
        return `Person says: ${message}`;
    }
}

enhance(Person.prototype, "say", loggingMiddleware());

const alice = new Person();
alice.say("Hello!");
// Logs:
// Calling greet with: ["Hello!"]
// Result: Person says: Hello!
```

#### How it Works

- The `enhance` function replaces the specified method on the object with a wrapped version that runs the provided middleware pipeline.
- If the target property is not a function, a `TypeError` is thrown.
- Multiple middlewares can be provided (as an array or single value).

This pattern is useful for adding cross-cutting concerns (logging, validation, authorization, etc.) to class methods in a reusable and declarative way.

### Applying Plugins with `withPluginFactory`

The `withPluginFactory` function provides a way to apply one or more plugins to a class instance or object literal, where each plugin can use the `enhance` function to wrap methods with middleware. This is useful for encapsulating cross-cutting concerns into reusable plugin units.

#### Purpose

`withPluginFactory` is a factory that takes an `Enhance` function (obtained from `enhanceFactory`) and returns a `WithPlugin` function. This `WithPlugin` function applies plugins to a **copy** of the target (class instance or object literal), always leaving the original unmodified.

#### Usage with Class Instances

```ts
import {
    useFactory,
    enhanceFactory,
    withPluginFactory,
} from "@daiso-tech/core/middleware";
import { type PluginFn } from "@daiso-tech/core/middleware/contracts";

const use = useFactory();
const enhance = enhanceFactory(use);
const withPlugin = withPluginFactory(enhance);

class UserService {
    async getUser(id: string): Promise<{ name: string }> {
        return { name: "Alice" };
    }

    async deleteUser(id: string): Promise<void> {
        // Deletion logic
    }
}

function withPerformanceLogging<
    TParameters extends Array<unknown>,
    TReturn,
>(): MiddlewareFn<TParameters, Promise<TReturn>> {
    return ({ next, name }) => {
        const start = performance.now();
        const returnValue = await next();
        const end = performance.now();
        const timeInMs = end - start;
        console.log(`function/method ${name} took ${timeInMs}ms`);
        return returnValue;
    };
}

// Define a logging plugin
const loggingPlugin: PluginFn<UserService> = (service, enhance) => {
    enhance(service, "getUser", withPerformanceLogging());

    enhance(service, "deleteUser", withPerformanceLogging());
};

// Apply the plugin to a class instance
const service = new UserService();
const enhancedService = withPlugin(service, loggingPlugin);

await enhancedService.getUser("123");
// Logs:
// getUser called with: ["123"]
// getUser returned: { name: "Alice" }

// The original service is NOT modified — a copy is returned instead
```

#### Usage with Object Literals

`withPlugin` also works with plain object literals:

```ts
const calculator = {
    add(a: number, b: number): number {
        return a + b;
    },
    subtract(a: number, b: number): number {
        return a - b;
    },
};

const loggingPlugin: PluginFn<typeof calculator> = (obj, enhance) => {
    enhance(obj, "add", withPerformanceLogging());

    enhance(obj, "subtract", withPerformanceLogging());
};

const enhancedCalc = withPlugin(calculator, loggingPlugin);

enhancedCalc.add(2, 3);
// Logs: add called with: [2, 3]

// The original calculator object is NOT modified — a copy is returned instead
```

#### Applying Multiple Plugins

You can apply multiple plugins at once by passing an array:

```ts
const monitoringPlugin: PluginFn<UserService> = (service, enhance) => {
    // Monitor methods...
};

const validationPlugin: PluginFn<UserService> = (service, enhance) => {
    // Validate methods...
};

const service = new UserService();
const enhancedService = withPlugin(service, [
    loggingPlugin,
    monitoringPlugin,
    validationPlugin,
]);
```

#### Object-based Plugins

For plugins with state or configuration, use the object form:

```ts
import { type IPluginObject } from "@daiso-tech/core/middleware/contracts";

class MetricsPlugin implements IPluginObject<UserService> {
    constructor(private readonly metricsClient: MetricsClient) {}

    invoke(service: UserService, enhance: Enhance): void {
        enhance(service, "getUser", [
            (next) =>
                async (...args) => {
                    const start = performance.now();
                    const result = await next(...args);
                    const duration = performance.now() - start;
                    this.metricsClient.record("getUser", duration);
                    return result;
                },
        ]);
    }
}

const service = new UserService();
const enhancedService = withPlugin(service, new MetricsPlugin(client));
```

#### How it Works

- `withPluginFactory` creates a `WithPlugin` function that **always** copies the target (whether a class instance or object literal), preserving the original.
- Each plugin is invoked in order, receiving the copied target and the `enhance` function.
- The `enhance` function wraps the specified method with a middleware pipeline.
- The enhanced copy is returned, leaving the original untouched.

:::info
This pattern is ideal for building reusable feature packs (logging, monitoring) that can be composed and applied to any class instance or object literal.
:::

## UseFactory configuration

## Further information

For further information refer to [`@daiso-tech/core/middleware`](https://daiso-tech.github.io/daiso-core/modules/Middleware.html) API docs.

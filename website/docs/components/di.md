---
sidebar_position: 1
sidebar_label: DI Container
pagination_label: DI Container usage
tags:
    - DI
    - Usage
    - Container
    - Dependency Injection
keywords:
    - DI
    - Usage
    - Container
    - Dependency Injection
---

# DI Container usage

The `@daiso-tech/core/di` component provides an Inversion of Control (IoC) container for managing service registrations, dependency resolution, and object lifetimes. It supports factory, value, and dynamic registrations with singleton, scoped, and transient lifetimes. Classes are registered through factory registrations, where the class itself acts as the token and a factory function constructs it.

## DI Basics

This section covers the fundamental concepts and everyday usage of the DI container. Start here if you are new to dependency injection or learning the API for the first time.

### Core concepts and terminology

Before diving into the API, it is helpful to understand the key concepts used throughout the DI container:

- **Token** — A unique identifier used to register and resolve a service. A token can be a class constructor (`ClassToken`) or a symbol-based token created with `genericToken()` (`GenericToken`).
- **Registration** — The act of telling the container how to create or provide a service identified by a token.
- **Resolution** — The act of asking the container to provide an instance of a registered service.
- **Lifetime** — Controls how many instances of a service are created and when they are shared. Supported lifetimes: `singleton`, `scoped`, and `transient`.
- **Scope** — An isolated execution context created via `container.run()` where scoped services are resolved once and then discarded.

### Initial configuration

To begin using the DI container, create a `Container` instance and provide an execution context:

```ts
import { Container } from "@daiso-tech/core/di";
import { AlsExecutionContextAdapter } from "@daiso-tech/core/execution-context/als-execution-context-adapter";
import { ExecutionContext } from "@daiso-tech/core/execution-context";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

const container = new Container({
    executionContext,
});
```

The `Container` requires an [`IExecutionContext`](./execution_context.md) instance. The execution context is used to propagate contextual information (such as request IDs or user sessions) through the dependency resolution chain.

:::info
For further information about the execution context, refer to the [`@daiso-tech/core/execution-context`](./execution_context.md) documentation.
:::

The container follows a strict lifecycle:

1. **Register** — call `registerFactory`, `registerValue`, `registerDynamic`, `registerProvider`, and register lifecycle hooks. All registrations must occur before initialization.
2. **Initialize** — call `await container.init()`. This validates the service graph (throwing `InvalidGraphDiError` for invalid lifetime configurations, dependency cycles, or undeclared dependencies) and prepares the container for use.
3. **Use** — resolve services (`resolve`, `resolveOr`, `resolveOrFail`, `has`) and run scoped executions (`container.run()`).
4. **Deinitialize** — call `await container.deInit()` during application shutdown.

:::warning
Calling a registration method after `container.init()`, or a resolution/scope method before `container.init()`, throws `InvalidMethodCallDiError`.
:::

### Service tokens

Tokens are how you identify services in the container. There are two kinds of tokens:

#### Class tokens

A class constructor can be used directly as a token. The class itself serves as the registration key — no separate token object is needed:

```ts
import { LIFESPAN } from "@daiso-tech/core/di/contracts";

class Logger {
    log(message: string): void {
        console.log(message);
    }
}

// The class itself is the token; use a factory to construct it
container.registerFactory({
    token: Logger,
    factory: () => new Logger(),
    deps: {},
    lifetime: LIFESPAN.SINGLETON,
});

// Initialize the container, then resolve using the class
await container.init();
const logger = await container.resolveOrFail(Logger);
```

#### Generic tokens

For interfaces, primitive values, or when you need to decouple the token from the implementation, use `genericToken()` to create a symbol-based token:

```ts
import { LIFESPAN, genericToken } from "@daiso-tech/core/di/contracts";

interface ILogger {
    log(message: string): void;
}

// Create a token for the interface
const ILOGGER = genericToken<ILogger>("ILogger");

class ConsoleLogger implements ILogger {
    log(message: string): void {
        console.log(message);
    }
}

container.registerFactory({
    token: ILOGGER,
    factory: () => new ConsoleLogger(),
    deps: {},
    lifetime: LIFESPAN.SINGLETON,
});

// Initialize the container, then resolve using the generic token
await container.init();
const logger = await container.resolveOrFail(ILOGGER);
```

:::tip
`DiToken<T>` is the union of `ClassToken<T>` and `GenericToken<T>`. Every registration and resolution API accepts a `DiToken<T>`, meaning you can freely mix class tokens and generic tokens.
:::

### Registration

The container provides three core registration methods — `registerFactory`, `registerValue`, and `registerDynamic` — plus `registerProvider` for grouping registrations (covered in the [Patterns](#patterns) section).

#### Factory registration

Use `registerFactory` when you need full control over how a service is created. The factory receives resolved dependencies and the current execution context:

```ts
import { LIFESPAN, genericToken } from "@daiso-tech/core/di/contracts";

interface IUserService {
    getUser(id: string): Promise<{ name: string }>;
}

const IUSER_SERVICE = genericToken<IUserService>("IUserService");
const IDATABASE = genericToken<Database>("IDatabase");

class Database {
    query(sql: string): Promise<any> {
        /* ... */
    }
}

container.registerFactory({
    token: IUSER_SERVICE,
    factory: async ({ db }, executionContext) => {
        // The factory receives a record of resolved dependencies,
        // followed by the execution context
        return {
            getUser: async (id: string) => {
                return db.query(`SELECT * FROM users WHERE id = ${id}`);
            },
        };
    },
    deps: { db: IDATABASE },
    lifetime: LIFESPAN.SINGLETON, // Choose the lifetime
});
```

The factory callback signature is `(deps, executionContext) => T | Promise<T>` where `deps` is a record keyed by the names declared in the `deps` setting (e.g., `{ db }`). The `executionContext` parameter is always the last argument. The `lifetime` is set directly on the registration using the `LIFESPAN` constant — there is no separate `.singleton()`/`.scoped()`/`.transient()` chain.

#### Value registration

Use `registerValue` for pre-constructed values or constants. Value registrations are always resolved as singletons:

```ts
const CONFIG = genericToken<AppConfig>("AppConfig");

container.registerValue({
    token: CONFIG,
    value: {
        apiUrl: "https://api.example.com",
        timeout: 5000,
    },
});

// Initialize the container, then resolve
await container.init();
const config = await container.resolveOrFail(CONFIG);
```

#### Dynamic registration

Use `registerDynamic` when a token's value is not known at registration time and must be provided later at runtime — for example, values derived from an incoming request:

```ts
const REQUEST_ID = genericToken<string>("RequestId");

// Register as dynamic — value will be provided later
container.registerDynamic(REQUEST_ID);
```

Dynamic values are set at runtime using the `IDynamicServiceRegister` interface, inside a scoped `run()` execution:

```ts
await container.init();

await container.run({
    dynamicRegistration: async (register) => {
        // Set the dynamic value before the scope executes
        await register.set({
            token: REQUEST_ID,
            value: crypto.randomUUID(),
        });
    },
    scope: async () => {
        const requestId = await container.resolveOrFail(REQUEST_ID);
        console.log(`Handling request: ${requestId}`);
    },
});
```

You can also provide a `DynamicValue` callback that receives the execution context:

```ts
await container.init();

await container.run({
    dynamicRegistration: async (register) => {
        await register.set({
            token: REQUEST_ID,
            value: (executionContext) => {
                // Compute the value using the execution context
                return (
                    executionContext.get("correlationId") ?? crypto.randomUUID()
                );
            },
        });
    },
    scope: async () => {
        const requestId = await container.resolveOrFail(REQUEST_ID);
        console.log(`Handling request: ${requestId}`);
    },
});
```

### Service lifetimes

A lifetime is chosen by setting the `lifetime` field directly on a `registerFactory` call, using the `LIFESPAN` constant from `@daiso-tech/core/di/contracts`.

```ts
import { LIFESPAN } from "@daiso-tech/core/di/contracts";

// Singleton: one instance shared across all resolutions
container.registerFactory({
    token: Logger,
    factory: () => new Logger(),
    deps: {},
    lifetime: LIFESPAN.SINGLETON,
});

// Scoped: one instance per container.run() scope
container.registerFactory({
    token: UserRepository,
    factory: ({ db }) => new UserRepository(db),
    deps: { db: Database },
    lifetime: LIFESPAN.SCOPED,
});

// Transient: a new instance every time
container.registerFactory({
    token: Mailer,
    factory: () => new Mailer(),
    deps: {},
    lifetime: LIFESPAN.TRANSIENT,
});
```

| Lifetime      | Instances created     | Shared across                     |
| ------------- | --------------------- | --------------------------------- |
| **Singleton** | One                   | All resolutions, all scopes       |
| **Scoped**    | One per `run()` scope | Resolutions within the same scope |
| **Transient** | One per resolution    | Not shared                        |

### Resolution

The `IServiceResolver` interface provides four methods for retrieving services. The container must be initialized (`await container.init()`) before any of them can be used:

#### `resolve` — Nullable resolution

Returns the service if found, `null` otherwise:

```ts
const logger = await container.resolve(Logger);
if (logger) {
    logger.log("Logger is available");
}
```

#### `resolveOr` — Resolution with default value

Returns the service if found, otherwise returns the provided default value:

```ts
const logger = await container.resolveOr(Logger, new ConsoleLogger());
logger.log("Always has a logger");
```

#### `resolveOrFail` — Strict resolution

Returns the service if found, otherwise throws `ServiceCanNotBeResolvedDiError`:

```ts
// Throws ServiceCanNotBeResolvedDiError if Logger is not registered
const logger = await container.resolveOrFail(Logger);
```

#### `has` — Existence check

Checks whether a token is registered without resolving it:

```ts
if (await container.has(Logger)) {
    console.log("Logger is registered");
}
```

### Scoped execution

The `IContainerScope.run()` method creates an isolated scope where scoped services are resolved once and then discarded. The container must be initialized before calling `run()`:

```ts
await container.init();
await container.run({
    // Optional: register dynamic values before the scope runs
    dynamicRegistration: async (register) => {
        await register.set({
            token: REQUEST_ID,
            value: crypto.randomUUID(),
        });
    },
    // The scope body (lazily evaluated)
    scope: async () => {
        // Scoped services are resolved once within this scope
        const repo1 = await container.resolveOrFail(UserRepository);
        const repo2 = await container.resolveOrFail(UserRepository);

        // repo1 === repo2 (same scope)
        console.log(repo1 === repo2); // true

        const requestId = await container.resolveOrFail(REQUEST_ID);
        console.log(`Request: ${requestId}`);
    },
});

// Outside the scope, scoped services are no longer available
// A new scope would create new instances
```

### Error handling

The container defines the following error types in `@daiso-tech/core/di/contracts`:

#### `ServiceCanNotBeResolvedDiError`

Thrown when a service cannot be resolved — e.g. the token is not registered, a scoped service is resolved outside a `run()` scope, or a dynamic token has no value set:

```ts
import { ServiceCanNotBeResolvedDiError } from "@daiso-tech/core/di/contracts";

try {
    await container.resolveOrFail(Logger);
} catch (error) {
    if (error instanceof ServiceCanNotBeResolvedDiError) {
        console.log("Logger was not registered");
    }
}
```

#### `InvalidGraphDiError`

Thrown by `container.init()` when the service graph is invalid — e.g. an invalid lifetime configuration (such as a singleton depending on a transient or scoped service), a dependency cycle, or a declared dependency that is not registered:

```ts
import { LIFESPAN, InvalidGraphDiError } from "@daiso-tech/core/di/contracts";

// ❌ Invalid: a singleton depending on a transient service
container.registerFactory({
    token: SingletonService,
    factory: ({ transient }) => new SingletonService(transient),
    deps: { transient: TransientService },
    lifetime: LIFESPAN.SINGLETON,
});

container.registerFactory({
    token: TransientService,
    factory: () => new TransientService(),
    deps: {},
    lifetime: LIFESPAN.TRANSIENT,
});

try {
    await container.init();
} catch (error) {
    if (error instanceof InvalidGraphDiError) {
        console.log("Invalid service graph");
    }
}
```

#### `CanNotRegisterServiceDiError`

Thrown when a service cannot be registered — for example, when a token already has a registration:

```ts
import { CanNotRegisterServiceDiError } from "@daiso-tech/core/di/contracts";

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

try {
    // Duplicate registration — throws CanNotRegisterServiceDiError
    container.registerValue({
        token: CONFIG,
        value: { apiUrl: "https://another.example.com", timeout: 3000 },
    });
} catch (error) {
    if (error instanceof CanNotRegisterServiceDiError) {
        console.log("Service could not be registered");
    }
}
```

#### `CanNotOverrideServiceDiError`

Thrown when a registration cannot be overridden — e.g. the token is not registered, it was registered as dynamic, or it has already been overridden:

```ts
import { CanNotOverrideServiceDiError } from "@daiso-tech/core/di/contracts";

try {
    container.overrideValue({
        token: CONFIG,
        value: { apiUrl: "http://localhost:9999", timeout: 100 },
    });
} catch (error) {
    if (error instanceof CanNotOverrideServiceDiError) {
        console.log("Token cannot be overridden");
    }
}
```

#### `InvalidMethodCallDiError`

Thrown when a container method is called at an invalid time or context — e.g. registering after `init()`, resolving before `init()`, or calling a method inside a `run()` scope that is not allowed there:

```ts
import { InvalidMethodCallDiError } from "@daiso-tech/core/di/contracts";

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

await container.init();

try {
    // Registering after init() throws
    container.registerValue({
        token: CONFIG,
        value: { apiUrl: "https://another.example.com", timeout: 3000 },
    });
} catch (error) {
    if (error instanceof InvalidMethodCallDiError) {
        console.log("Invalid method call");
    }
}
```

## Patterns

This section covers advanced patterns, architectural considerations, and real-world techniques for structuring larger applications with the DI container. Familiarity with the [DI Basics](#di-basics) is assumed.

### Service providers

Service providers encapsulate a group of related registrations into a reusable, isolated code block — similar to Laravel service providers:

```ts
import { LIFESPAN, type IServiceRegister } from "@daiso-tech/core/di/contracts";

// As a plain function
async function loggingProvider(register: IServiceRegister): Promise<void> {
    register.registerFactory({
        token: Logger,
        factory: () => new Logger(),
        deps: {},
        lifetime: LIFESPAN.SINGLETON,
    });

    register.registerFactory({
        token: FileLogger,
        factory: () => new FileLogger(),
        deps: {},
        lifetime: LIFESPAN.SINGLETON,
    });
}

// As an object with an invoke method
class DatabaseProvider {
    async invoke(register: IServiceRegister): Promise<void> {
        register.registerFactory({
            token: Database,
            factory: () => new Database(),
            deps: {},
            lifetime: LIFESPAN.SINGLETON,
        });

        register.registerFactory({
            token: UserRepository,
            factory: ({ db }) => new UserRepository(db),
            deps: { db: Database },
            lifetime: LIFESPAN.SCOPED,
        });
    }
}

// Register providers
container.registerProvider(loggingProvider);
container.registerProvider(new DatabaseProvider());
```

:::tip
Service providers are the recommended way to organize your registrations. Group related services together and keep each provider focused on a single concern.
:::

### Overriding registrations

The `IServiceOverrider` interface allows replacing existing registrations — useful primarily for testing:

```ts
// Override an existing factory registration
container.overrideFactory({
    token: IDATABASE,
    factory: async (_deps, _executionContext) => {
        // Return a mock database for testing
        return new MockDatabase();
    },
    deps: {},
});

// Override an existing value registration
container.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://localhost:9999", timeout: 100 },
});
```

### Lifecycle hooks

The `IContainerHooks` interface lets you register handlers that run during container initialization and deinitialization:

```ts
container.onContainerInit(async (resolver) => {
    // Runs when container.init() is called
    // Use the resolver to resolve services after all registrations are complete
    const db = await resolver.resolveOrFail(Database);
    await db.connect();
    console.log("Container initialized");
});

container.onContainerDeInit(async (resolver) => {
    // Runs when container.deInit() is called
    const db = await resolver.resolveOrFail(Database);
    await db.disconnect();
    console.log("Container deinitialized");
});

// Trigger the lifecycle
await container.init();
// ... application runs ...
await container.deInit();
```

The `DiHook` callback receives an `IServiceResolver` to resolve services during the hook. Hooks must be registered before `container.init()` is called.

### Child containers

The `fork()` method creates a child container that inherits all registrations from the parent. The child can override registrations without affecting the parent:

```ts
const childContainer = container.fork();

// Override in the child container — parent is unaffected
childContainer.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://test.local", timeout: 100 },
});

// Both containers must be initialized before resolving
await container.init();
await childContainer.init();

// Original container still has the original config
const parentConfig = await container.resolveOrFail(CONFIG);
const childConfig = await childContainer.resolveOrFail(CONFIG);

console.log(parentConfig.apiUrl); // "https://api.example.com"
console.log(childConfig.apiUrl); // "http://test.local"
```

Child containers are particularly useful for **testing**: fork the main container, override only the services you want to mock or stub, and run your tests in isolation without polluting the original registrations.

### Best practices

#### Use generic tokens for interfaces and primitives

Use `genericToken()` for interfaces, abstract classes, and primitive values. Use class tokens only for concrete classes that serve as their own implementation:

```ts
import { LIFESPAN } from "@daiso-tech/core/di/contracts";

// ✅ Good: Interface mapped via generic token
const ILOGGER = genericToken<ILogger>("ILogger");
container.registerFactory({
    token: ILOGGER,
    factory: () => new ConsoleLogger(),
    deps: {},
    lifetime: LIFESPAN.SINGLETON,
});

// ✅ Good: Concrete class is its own token
container.registerFactory({
    token: Database,
    factory: () => new Database(),
    deps: {},
    lifetime: LIFESPAN.SINGLETON,
});
```

#### Organize registrations with service providers

Group related registrations into service providers to keep your composition root clean and maintainable:

```ts
// providers/logging.provider.ts
export async function loggingProvider(
    register: IServiceRegister,
): Promise<void> {
    register.registerFactory({
        token: Logger,
        factory: () => new Logger(),
        deps: {},
        lifetime: LIFESPAN.SINGLETON,
    });
}

// providers/database.provider.ts
export class DatabaseProvider implements IServiceProvider {
    async invoke(register: IServiceRegister): Promise<void> {
        register.registerFactory({
            token: Database,
            factory: () => new Database(),
            deps: {},
            lifetime: LIFESPAN.SINGLETON,
        });
        register.registerFactory({
            token: UserRepository,
            factory: ({ db }) => new UserRepository(db),
            deps: { db: Database },
            lifetime: LIFESPAN.SCOPED,
        });
    }
}

// main.ts
container.registerProvider(loggingProvider);
container.registerProvider(new DatabaseProvider());
```

#### Choose the right lifetime

- Use **singleton** for stateless services, configuration, and shared resources.
- Use **scoped** for services that should be unique per request or unit of work (e.g., database transactions, unit of work).
- Use **transient** for lightweight, short-lived services that hold no shared state.

#### Use scoped execution for request-bound data

Wrap request handling in `container.run()` to isolate scoped services and dynamic values per request:

```ts
async function handleRequest(request: Request): Promise<Response> {
    let response: Response;

    await container.run({
        dynamicRegistration: async (register) => {
            await register.set({
                token: REQUEST_ID,
                value:
                    request.headers.get("x-request-id") ?? crypto.randomUUID(),
            });
        },
        scope: async () => {
            const controller = await container.resolveOrFail(UserController);
            response = controller.handle(request);
        },
    });

    return response;
}
```

#### Initialize the container lifecycle

Call `container.init()` after all registrations are complete and `container.deInit()` during application shutdown:

```ts
await container.init();
// ... application lifecycle ...
await container.deInit();
```

### Common mistakes and how to avoid them

#### Registering the same token twice

Attempting to register a token that already exists throws `CanNotRegisterServiceDiError`. Use `overrideValue()` or `overrideFactory()` if you intend to replace an existing registration:

```ts
// ❌ Wrong: duplicate registration
container.registerValue({ token: CONFIG, value: configA });
container.registerValue({ token: CONFIG, value: configB }); // Throws!

// ✅ Correct: use override
container.registerValue({ token: CONFIG, value: configA });
container.overrideValue({ token: CONFIG, value: configB }); // Works
```

#### Invalid lifetime dependencies

The container enforces lifetime compatibility to prevent **captive dependency** bugs — where a long-lived service inadvertently captures a short-lived dependency, causing stale or shared state. The table below shows which lifetimes are valid:

| Consumer Lifetime | Can depend on                                    |
| ----------------- | ------------------------------------------------ |
| **Singleton**     | Singleton, Value                                 |
| **Scoped**        | Singleton, Scoped, Dynamic, Value                |
| **Transient**     | Singleton, Scoped, Transient, Value              |
| **Dynamic**       | None (dynamic nodes cannot declare dependencies) |

Any combination not listed in this table will throw `InvalidGraphDiError` (flag `INVALID_EDGE_RELATIONSHIP`) when the container is initialized. The most common violation is a singleton depending on a scoped or transient service:

```ts
// ❌ Wrong: Singleton → Transient
container.registerFactory({
    token: SingletonA,
    factory: ({ transient }) => new SingletonA(transient),
    deps: { transient: TransientB },
    lifetime: LIFESPAN.SINGLETON,
});
container.registerFactory({
    token: TransientB,
    factory: () => new TransientB(),
    deps: {},
    lifetime: LIFESPAN.TRANSIENT,
});
// container.init() throws InvalidGraphDiError

// ✅ Correct: Upgrade TransientB to Scoped or Singleton
container.registerFactory({
    token: SingletonA,
    factory: ({ transient }) => new SingletonA(transient),
    deps: { transient: TransientB },
    lifetime: LIFESPAN.SINGLETON,
});
container.registerFactory({
    token: TransientB,
    factory: () => new TransientB(),
    deps: {},
    lifetime: LIFESPAN.SCOPED, // Upgraded
});
```

#### Forgetting to set dynamic values

A token registered with `registerDynamic()` must have its value set via `IDynamicServiceRegister.set()` before it is resolved. Attempting to resolve a dynamic token without a value set will throw `ServiceCanNotBeResolvedDiError`:

```ts
// ❌ Wrong: dynamic token never set
container.registerDynamic(REQUEST_ID);
await container.init();
await container.resolveOrFail(REQUEST_ID); // Throws ServiceCanNotBeResolvedDiError

// ✅ Correct: set the value in a scope
await container.init();
await container.run({
    dynamicRegistration: async (register) => {
        await register.set({ token: REQUEST_ID, value: "req-123" });
    },
    scope: async () => {
        const id = await container.resolveOrFail(REQUEST_ID); // Works
    },
});
```

#### Resolving scoped services outside a scope

Scoped services are only available within a `container.run()` scope. Resolving them outside a scope will throw `ServiceCanNotBeResolvedDiError` (flag `SCOPED_SERVICE_OUTSIDE_RUN`).

### Performance considerations

- **Singleton resolution** is the fastest — the instance is created once and cached.
- **Scoped resolution** has minimal overhead per scope — instances are cached within the scope.
- **Transient resolution** creates a new instance every time, which can be expensive if the service has a deep dependency graph. Use transient only when fresh state is required.
- **Factory functions** can be synchronous or asynchronous and can perform I/O. Avoid heavy computation or blocking operations in factory callbacks.
- **Service providers** (both functions and `IServiceProvider` objects) are invoked during registration, not during resolution. Provider invocation is synchronous but can be async.

### Further information

For further information refer to [`@daiso-tech/core/di`](https://daiso-tech.github.io/daiso-core/modules/DI.html) API docs.

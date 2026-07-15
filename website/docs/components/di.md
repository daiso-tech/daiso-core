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

The `@daiso-tech/core/di` component provides an Inversion of Control (IoC) container for managing service registrations, dependency resolution, and object lifetimes. It supports factory, class, value, and dynamic registrations with singleton, scoped, and transient lifetimes.

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

const executionContext = new ExecutionContext(
    new AlsExecutionContextAdapter(),
);

const container = new Container({
    executionContext,
});
```

The `Container` requires an [`IExecutionContext`](./execution_context.md) instance. The execution context is used to propagate contextual information (such as request IDs or user sessions) through the dependency resolution chain.

:::info
For further information about the execution context, refer to the [`@daiso-tech/core/execution-context`](./execution_context.md) documentation.
:::

### Service tokens

Tokens are how you identify services in the container. There are two kinds of tokens:

#### Class tokens

A class constructor can be used directly as a token. The class itself serves as the registration key — no separate token object is needed:

```ts
class Logger {
    log(message: string): void {
        console.log(message);
    }
}

// The class itself is the token
container.registerClass({
    impl: Logger,
    deps: [],
}).singleton();

// Resolve using the class
const logger = await container.resolveOrFail(Logger);
```

#### Generic tokens

For interfaces, primitive values, or when you need to decouple the token from the implementation, use `genericToken()` to create a symbol-based token:

```ts
import { genericToken } from "@daiso-tech/core/di/contracts";

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

container.registerClass({
    impl: ConsoleLogger,
    deps: [],
}).singleton();

// Resolve using the generic token
const logger = await container.resolveOrFail(ILOGGER);
```

:::tip
`DiToken<T>` is the union of `ClassToken<T>` and `GenericToken<T>`. Every registration and resolution API accepts a `DiToken<T>`, meaning you can freely mix class tokens and generic tokens.
:::

### Registration

The container provides four core registration methods for defining how services are created.

#### Factory registration

Use `registerFactory` when you need full control over how a service is created. The factory receives resolved dependencies and the current execution context:

```ts
import { genericToken } from "@daiso-tech/core/di/contracts";

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
    factory: async (db: Database, executionContext) => {
        // The factory receives resolved dependencies in order,
        // followed by the execution context
        return {
            getUser: async (id: string) => {
                return db.query(`SELECT * FROM users WHERE id = ${id}`);
            },
        };
    },
    deps: [IDATABASE],
}).singleton(); // Choose the lifetime
```

The factory callback signature is `(...deps, executionContext) => T | Promise<T>`. The `executionContext` parameter is always the last argument.

#### Class registration

Use `registerClass` when a class should be constructed by the container with its dependencies automatically injected:

```ts
class UserController {
    constructor(
        private readonly userService: IUserService,
        private readonly logger: Logger,
    ) {}

    async handleRequest(userId: string): Promise<void> {
        const user = await this.userService.getUser(userId);
        this.logger.log(`Found user: ${user.name}`);
    }
}

container.registerClass({
    impl: UserController,
    deps: [IUSER_SERVICE, Logger],
}).transient();
```

The container will instantiate the class with resolved dependencies passed to the constructor in the order specified by the `deps` array.

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

// Later
const config = await container.resolveOrFail(CONFIG);
```

:::note
`registerValue` does not return an `IServiceLifetime` because value registrations are implicitly singletons. You cannot change their lifetime.
:::

#### Dynamic registration

Use `registerDynamic` when a token's value is not known at registration time and must be provided later at runtime — for example, values derived from an incoming request:

```ts
const REQUEST_ID = genericToken<string>("RequestId");

// Register as dynamic — value will be provided later
container.registerDynamic(REQUEST_ID);
```

Dynamic values are set at runtime using the `IDynamicServiceRegister` interface, typically inside a scoped `run()` execution:

```ts
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
await container.run({
    dynamicRegistration: async (register) => {
        await register.set({
            token: REQUEST_ID,
            value: (executionContext) => {
                // Compute the value using the execution context
                return executionContext.get("correlationId") ?? crypto.randomUUID();
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

The `IServiceLifetime` interface — returned by `registerFactory` and `registerClass` — is a fluent API for choosing how many instances are created and when they are shared:

```ts
// Singleton: one instance shared across all resolutions
container.registerClass({
    impl: Logger,
    deps: [],
}).singleton();

// Scoped: one instance per container.run() scope
container.registerClass({
    impl: UserRepository,
    deps: [Database],
}).scoped();

// Transient: a new instance every time
container.registerClass({
    impl: Mailer,
    deps: [],
}).transient();
```

| Lifetime | Instances created | Shared across |
|---|---|---|
| **Singleton** | One | All resolutions, all scopes |
| **Scoped** | One per `run()` scope | Resolutions within the same scope |
| **Transient** | One per resolution | Not shared |

:::warning
Some lifetime combinations are invalid and will throw an `InvalidLifetimeDiError`:

- Singleton depending on Transient
- Singleton depending on Scoped
- Singleton depending on Dynamic
- Scoped depending on Transient
- Dynamic depending on Transient
- Transient depending on Dynamic
:::

### Resolution

The `IServiceResolver` interface provides four methods for retrieving services:

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

Returns the service if found, otherwise throws `ServiceNotFoundDiError`:

```ts
// Throws ServiceNotFoundDiError if Logger is not registered
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

The `IContainerScope.run()` method creates an isolated scope where scoped services are resolved once and then discarded:

```ts
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

:::info
The `scope` field is an `AsyncLazy<TValue>`, meaning the scope body is not executed immediately when `run()` is called — it is evaluated lazily. This allows the container to set up the scope context (including dynamic registrations) before the body runs.
:::

### Error handling

The container defines four error types in `@daiso-tech/core/di/contracts`:

#### `ServiceNotFoundDiError`

Thrown when a service cannot be resolved — either it was never registered or could not be constructed:

```ts
import { ServiceNotFoundDiError } from "@daiso-tech/core/di/contracts";

try {
    await container.resolveOrFail(Logger);
} catch (error) {
    if (error instanceof ServiceNotFoundDiError) {
        console.log("Logger was not registered");
    }
}
```

#### `InvalidLifetimeDiError`

Thrown when a lifetime configuration is invalid. The following combinations are invalid:

| Lifetime | Cannot depend on |
|---|---|
| Singleton | Transient, Scoped, Dynamic |
| Scoped | Transient |
| Dynamic | Transient |
| Transient | Dynamic |

```ts
import { InvalidLifetimeDiError } from "@daiso-tech/core/di/contracts";

try {
    container.registerClass({
        impl: SingletonService,
        deps: [TransientService], // Invalid!
    }).singleton();
} catch (error) {
    if (error instanceof InvalidLifetimeDiError) {
        console.log("Invalid lifetime configuration");
    }
}
```

#### `CircularDependencyDiError`

Thrown when two or more services form a dependency cycle:

```ts
import { CircularDependencyDiError } from "@daiso-tech/core/di/contracts";

// A depends on B, B depends on A — circular!
// container.registerClass({ impl: ServiceA, deps: [ServiceB] });
// container.registerClass({ impl: ServiceB, deps: [ServiceA] });

try {
    await container.resolveOrFail(ServiceA);
} catch (error) {
    if (error instanceof CircularDependencyDiError) {
        console.log("Circular dependency detected");
    }
}
```

#### `ServiceExistsDiError`

Thrown when attempting to register a token that already has a registration:

```ts
import { ServiceExistsDiError } from "@daiso-tech/core/di/contracts";

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

try {
    // Duplicate registration — throws ServiceExistsDiError
    container.registerValue({
        token: CONFIG,
        value: { apiUrl: "https://another.example.com", timeout: 3000 },
    });
} catch (error) {
    if (error instanceof ServiceExistsDiError) {
        console.log("Token is already registered. Use overrideValue() instead.");
    }
}
```

## Patterns

This section covers advanced patterns, architectural considerations, and real-world techniques for structuring larger applications with the DI container. Familiarity with the [DI Basics](#di-basics) is assumed.

### Contextual binding

Contextual binding allows you to provide a specific implementation of a dependency only when it is requested by a particular consumer. This enables swapping implementations on a per-consumer basis without changing the consumer's own registration:

```ts
const IDATABASE = genericToken<Database>("IDatabase");
const MYSQL_DATABASE = genericToken<Database>("MysqlDatabase");
const POSTGRES_DATABASE = genericToken<Database>("PostgresDatabase");

class UserService {
    constructor(private readonly db: Database) {}
}

class OrderService {
    constructor(private readonly db: Database) {}
}

// Both services depend on IDATABASE, but we want different implementations
container.registerContext({
    when: UserService,       // When UserService needs...
    needs: IDATABASE,         // ...the IDATABASE dependency...
    give: MYSQL_DATABASE,     // ...provide MySQL
});

container.registerContext({
    when: OrderService,       // When OrderService needs...
    needs: IDATABASE,         // ...the IDATABASE dependency...
    give: POSTGRES_DATABASE,  // ...provide Postgres
});
```

### Service providers

Service providers encapsulate a group of related registrations into a reusable, isolated code block — similar to Laravel service providers:

```ts
import type { IServiceRegister } from "@daiso-tech/core/di/contracts";

// As a plain function
async function loggingProvider(register: IServiceRegister): Promise<void> {
    register.registerClass({
        impl: Logger,
        deps: [],
    }).singleton();

    register.registerClass({
        impl: FileLogger,
        deps: [],
    }).singleton();
}

// As an object with an invoke method
class DatabaseProvider {
    async invoke(register: IServiceRegister): Promise<void> {
        register.registerClass({
            impl: Database,
            deps: [],
        }).singleton();

        register.registerClass({
            impl: UserRepository,
            deps: [Database],
        }).scoped();
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
    factory: async (_deps, executionContext) => {
        // Return a mock database for testing
        return new MockDatabase();
    },
    deps: [],
});

// Override an existing class registration
container.overrideClass({
    impl: TestLogger,
    deps: [],
});

// Override an existing value registration
container.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://localhost:9999", timeout: 100 },
});
```

:::note
`overrideFactory`, `overrideClass`, and `overrideValue` are designed for testing scenarios. Unlike `register*` methods, overrides do not return an `IServiceLifetime` — the overridden registration keeps its original lifetime.
:::

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

The `DiHook` callback receives an `IServiceResolver` to resolve services during the hook.

### Child containers

The `fork()` method creates a child container that inherits all registrations from the parent. The child can override registrations without affecting the parent:

```ts
const childContainer = container.fork();

// Override in the child container — parent is unaffected
childContainer.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://test.local", timeout: 100 },
});

// Original container still has the original config
const parentConfig = await container.resolveOrFail(CONFIG);
const childConfig = await childContainer.resolveOrFail(CONFIG);

console.log(parentConfig.apiUrl); // "https://api.example.com"
console.log(childConfig.apiUrl);  // "http://test.local"
```

Child containers are particularly useful for **testing**: fork the main container, override only the services you want to mock or stub, and run your tests in isolation without polluting the original registrations.

### Best practices

#### Use generic tokens for interfaces and primitives

Use `genericToken()` for interfaces, abstract classes, and primitive values. Use class tokens only for concrete classes that serve as their own implementation:

```ts
// ✅ Good: Interface mapped via generic token
const ILOGGER = genericToken<ILogger>("ILogger");
container.registerClass({ impl: ConsoleLogger, deps: [], token: ILOGGER });

// ✅ Good: Concrete class is its own token
container.registerClass({ impl: Database, deps: [] });
```

#### Organize registrations with service providers

Group related registrations into service providers to keep your composition root clean and maintainable:

```ts
// providers/logging.provider.ts
export async function loggingProvider(register: IServiceRegister): Promise<void> {
    register.registerClass({ impl: Logger, deps: [] }).singleton();
}

// providers/database.provider.ts
export class DatabaseProvider implements IServiceProvider {
    async invoke(register: IServiceRegister): Promise<void> {
        register.registerClass({ impl: Database, deps: [] }).singleton();
        register.registerClass({ impl: UserRepository, deps: [Database] }).scoped();
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
    return container.run({
        dynamicRegistration: async (register) => {
            await register.set({
                token: REQUEST_ID,
                value: request.headers.get("x-request-id") ?? crypto.randomUUID(),
            });
        },
        scope: async () => {
            const controller = await container.resolveOrFail(UserController);
            return controller.handle(request);
        },
    });
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

Attempting to register a token that already exists throws `ServiceExistsDiError`. Use `overrideValue()`, `overrideFactory()`, or `overrideClass()` if you intend to replace an existing registration:

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

| Consumer Lifetime | Can depend on |
|---|---|
| **Singleton** | Singleton, Value |
| **Scoped** | Singleton, Scoped, Dynamic, Value |
| **Transient** | Singleton, Scoped, Transient, Value |
| **Dynamic** | Singleton, Scoped, Dynamic, Value |

Any combination not listed in this table will throw `InvalidLifetimeDiError`. The most common violation is a singleton depending on a scoped or transient service:

```ts
// ❌ Wrong: Singleton → Transient
container.registerClass({ impl: SingletonA, deps: [TransientB] }).singleton();
// Throws InvalidLifetimeDiError

// ✅ Correct: Upgrade TransientB to Scoped or Singleton
container.registerClass({ impl: SingletonA, deps: [TransientB] }).singleton();
container.registerClass({ impl: TransientB, deps: [] }).scoped(); // Upgraded
```

#### Forgetting to set dynamic values

A token registered with `registerDynamic()` must have its value set via `IDynamicServiceRegister.set()` before it is resolved. Attempting to resolve a dynamic token without setting its value will throw `ServiceNotFoundDiError`:

```ts
// ❌ Wrong: dynamic token never set
container.registerDynamic(REQUEST_ID);
await container.resolveOrFail(REQUEST_ID); // Throws ServiceNotFoundDiError

// ✅ Correct: set the value in a scope
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

Scoped services are only available within a `container.run()` scope. Resolving them outside a scope will throw `ServiceNotFoundDiError` or similar resolution errors.

### Performance considerations

- **Singleton resolution** is the fastest — the instance is created once and cached.
- **Scoped resolution** has minimal overhead per scope — instances are cached within the scope.
- **Transient resolution** creates a new instance every time, which can be expensive if the service has a deep dependency graph. Use transient only when fresh state is required.
- **Factory registrations** are resolved asynchronously and can perform I/O. Avoid heavy computation or blocking operations in factory callbacks.
- **Service providers** (both functions and `IServiceProvider` objects) are invoked during registration, not during resolution. Provider invocation is synchronous but can be async.

### Further information

For further information refer to [`@daiso-tech/core/di`](https://daiso-tech.github.io/daiso-core/modules/DI.html) API docs.


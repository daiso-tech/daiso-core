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

The `eridu-tech/di` component provides an Inversion of Control (IoC) container for managing service registrations, dependency resolution, and object lifetimes.

### Initial Configuration

To begin using the DI container, create a `Container` instance and provide an [`IExecutionContext`](./execution_context.md):

```ts
import { Container } from "eridu-tech/di";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { ExecutionContext } from "eridu-tech/execution-context";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

const container = new Container({
    executionContext,
});
```

## DI Basics

<!-- The container follows a strict lifecycle:

1. **Register** — call `registerFactory`, `registerValue`, `registerDynamic`, `registerProvider`, and register lifecycle hooks. All registrations must occur before initialization.
2. **Initialize** — call `await container.init()`. This validates the service graph (throwing `InvalidGraphDiError` for invalid lifetime configurations, dependency cycles, or undeclared dependencies) and prepares the container for use.
3. **Use** — resolve services (`resolve`, `resolveOr`, `resolveOrFail`, `has`) and run scoped executions (`container.run()`).
4. **Deinitialize** — call `await container.deInit()` during application shutdown.

:::warning
Calling a registration method after `container.init()`, or a resolution/scope method before `container.init()`, throws `InvalidMethodCallDiError`.
::: -->

<!-- ### Service tokens

Tokens are how you identify services in the container. There are two kinds of tokens:

#### Class tokens

A class constructor can be used directly as a token. The class itself serves as the registration key — no separate token object is needed:

```ts
import { LIFETIME } from "eridu-tech/di/contracts";

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
    lifetime: LIFETIME.SINGLETON,
});

// Initialize the container, then resolve using the class
await container.init();
const logger = await container.resolveOrFail(Logger);
```

#### Generic tokens

For interfaces, primitive values, or when you need to decouple the token from the implementation, use `genericToken()` to create a symbol-based token:

```ts
import { LIFETIME, genericToken } from "eridu-tech/di/contracts";

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
    lifetime: LIFETIME.SINGLETON,
});

// Initialize the container, then resolve using the generic token
await container.init();
const logger = await container.resolveOrFail(ILOGGER);
```

:::tip
`DiToken<T>` is the union of `ClassToken<T>` and `GenericToken<T>`. Every registration and resolution API accepts a `DiToken<T>`, meaning you can freely mix class tokens and generic tokens.
::: -->

### Overview

The container follows a strict lifecycle.

#### Register Services and Container Hooks

Register your services by defining their lifespans, dependencies, and service factories. Register hooks that will run after container initialization or de-initialization. All registrations must occur before initialization. The following methods are used to register services: [`registerFactory`](#registerfactory), [`registerValue`](#registervalue), [`registerDynamic`](#dynamic-registration), [`registerProvider`](#registerprovider). The following are used to register container hooks: [`onContainerInit`](#container-hooks) and [`onContainerDeInit`](#container-hooks).

:::info
Services and hooks can only be registered before the container is initialized. Once the container is initialized, registering new services or hooks will throw [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

#### Initialize and Activate the Container

Call `init()` to prepare the container. The method `init()` executes all registered initialization hooks.

:::info
The current implementation of `IContainer` is _**eager**_. The container will instantiate all services ahead of time rather than lazily upon first resolution. The current implementation also validates the dependency graph when `init()` is called.
:::

#### Use the Container

Resolve service instances and run scoped executions. The following methods are used to resolve services: [`resolve`](#resolve), [`resolveOr`](#resolveor), [`resolveOrFail`](#resolveorfail). The following method is used to check if a service is resolvable: [`has`](#has). The following method is used to run scoped executions: [`run`](#scoped-execution).

:::info
Services can only be resolved while the container is in an active state (after initialization and before de-initialization). Resolving services before initialization or after de-initialization will throw [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

#### De-Initialize the Container

Call `deInit()` to tear down the container. The method `deInit()` executes all registered de-initialization hooks.

### Tokens

A **token** is the key that identifies a service in the container. It is used both to **register** a service and to **resolve** it later. A token can be either a _**class constructor**_ or a _**generic token**_ created via `genericToken()`.

To create a token using `genericToken()`, pass a string describing the service and an optional phantom type parameter. The phantom type exists purely for static type checking. It holds no runtime value and is used by TypeScript to infer the correct service type upon resolution.

Example of a generic token created with the `genericToken` method:

```ts
import { genericToken } from "eridu-tech/di/contracts";

interface IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown>;
}

// token created with genericToken where
// `"Database service"` is the description and `IDatabase` is the phantom type.
const IDATABASE = genericToken<IDatabase>("Database service");
```

Example of a class constructor used as a token:

```ts
class Database implements IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown> {
        /* ... */
    }
}

// Database's class constructor used as token.
const DATABASE = Database;
```

### Lifetime

When registering a service, you also define its lifetime. There are four different service lifetimes:

- **Singleton** — The container creates a single instance of the service for its entire lifetime and shares it across every resolve call and scope.

- **Scoped** — The container creates one instance of the service per [`run()`](#scoped-execution) scope and shares it whenever you resolve the service within that scope. For more details, see the [scoped execution](#scoped-execution) section.

- **Transient** — The container creates a new instance of the service every time you resolve the service and never shares it.

- **Dynamic** — The service is declared but has no service factory registered with it. The service factory will be provided dynamically within a [`run()`](#scoped-execution) scope before it can be resolved. For more details, see the [dynamic registration](#dynamic-registration) section.

### Registration

The container provides four registration methods:

- **`registerFactory`** — Registers a service using a factory function that creates the instance. Use it to register **Singleton**, **Scoped**, or **Transient** services with full control over how the instance is constructed.
- **`registerValue`** — Registers a pre-constructed value or constant. Values are always resolved as singletons.
- **`registerDynamic`** — Registers a token whose value is not known at registration time and is provided later at runtime, per [`run()`](#scoped-execution) scope.
- **`registerProvider`** — Registers a service provider that batches a group of related registrations into one reusable code block.

#### `registerFactory`

Use `registerFactory()` to register a **Singleton**, **Scoped**, or **Transient** service using a service factory function. It takes the following arguments:

- **`token`** — The key that identifies the service.

- **`deps`** — The dependencies required by the service, defined as a record where each value is a **token** identifying a dependency. Pass an empty object literal `{}` if the service has no dependencies.

- **`factory`** — [`invocable`](utilities/invocable.md) (function or object with `invoke` method) that creates and returns the service instance. It receives a record of resolved dependencies as its first argument and the [`execution context`](./execution_context.md) as its second argument. The factory can also be `async` and return a `Promise`.

- **`lifetime`** — The lifetime of the service. Must be either `LIFETIME.SINGLETON`, `LIFETIME.TRANSIENT` or `LIFETIME.SCOPED`.

Here is a simple example of `registerFactory()` with no dependencies:

```ts
import { LIFETIME, genericToken } from "eridu-tech/di/contracts";

interface IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown>;
}

const IDATABASE = genericToken<IDatabase>("IDatabase");

class Database implements IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown> {
        /* ... */
    }
}
// `IDATABASE` service requires no dependency
container.registerFactory({
    token: IDATABASE,
    deps: {}, // No dependencies
    factory: (deps) => new Database(),
    lifetime: LIFETIME.SINGLETON,
});
```

Here is a simple example of `registerFactory()` with one dependency:

```ts
interface User {
    firstName: string;
    lastName: string;
    email: string;
    id: string;
}

class UserProvider {
    constructor(private database: IDatabase) {
        /* ... */
    }

    getUser(id: string): User {
        /* ... */
    }
}

// `UserProvider` service requires `IDATABASE` dependency
container.registerFactory({
    token: UserProvider,
    deps: { db: IDATABASE },
    factory: (deps) => new UserProvider(deps.db),
    lifetime: LIFETIME.SINGLETON,
});
```

Here is an example of `registerFactory()` that reads a value from the `executionContext`:

```ts
import { contextToken } from "eridu-tech/execution-context/contracts";

// A context token for the current request id
const REQUEST_ID = contextToken<string>("requestId");

class RequestService {
    constructor(private requestId: string) {
        /* ... */
    }
}

container.registerFactory({
    token: RequestService,
    deps: {},
    factory: (deps, executionContext) => {
        // Read a contextual value propagated through the resolution chain
        const requestId = executionContext.get(REQUEST_ID) ?? "unknown";
        return new RequestService(requestId);
    },
    lifetime: LIFETIME.TRANSIENT,
});
```

Here is an example of a service factory defined as an object with an `invoke` method.

```ts
const serviceAsObject = {
    invoke() {
        return "hello";
    },
} satisfies ServiceFactory;

// functionally equivalent to serviceAsFunction
const serviceAsFunction = (() => "hello") satisfies ServiceFactory;
```

<!-- ```ts
import { LIFETIME, genericToken } from "eridu-tech/di/contracts";

interface IUserService {
    getUser(id: string): Promise<{ name: string }>;
}

const IUSER_SERVICE = genericToken<IUserService>("IUserService");
const IDATABASE = genericToken<Database>("IDatabase");

class Database {
    query(sql: string, params: Array<unknown>): Promise<any> {
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
                return db.query("SELECT * FROM users WHERE id = ?", [id]);
            },
        };
    },
    deps: { db: IDATABASE },
    lifetime: LIFETIME.SINGLETON, // Choose the lifetime
});
``` -->

#### `registerValue`

Use `registerValue()` to register values as singletons.

```ts
interface AppConfig {
    apiUrl: string;
    timeout: number;
}

const CONFIG = genericToken<AppConfig>("AppConfig");

container.registerValue({
    token: CONFIG,
    value: {
        apiUrl: "https://api.example.com",
        timeout: 5000,
    },
});
```

#### `registerProvider`

Use `registerProvider()` to encapsulate a group of related registrations into a reusable, isolated code block. A service provider can be either:

- A plain **function** that receives an `IServiceRegister` to register services.
- A **class** with an `invoke(register: IServiceRegister)` method.

```ts
import {
    LIFETIME,
    type IServiceRegister,
    type IServiceProvider,
} from "eridu-tech/di/contracts";

// As a plain function
function loggingProvider(register: IServiceRegister): void {
    register.registerFactory({
        token: Logger,
        factory: () => new Logger(),
        deps: {},
        lifetime: LIFETIME.SINGLETON,
    });

    register.registerFactory({
        token: FileLogger,
        factory: () => new FileLogger(),
        deps: {},
        lifetime: LIFETIME.SINGLETON,
    });
}

// As a class with an invoke(register: IServiceRegister) method
class DatabaseProvider implements IServiceProvider {
    invoke(register: IServiceRegister): void {
        register.registerFactory({
            token: Database,
            factory: () => new Database(),
            deps: {},
            lifetime: LIFETIME.SINGLETON,
        });

        register.registerFactory({
            token: UserRepository,
            factory: ({ db }) => new UserRepository(db),
            deps: { db: Database },
            lifetime: LIFETIME.SCOPED,
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

#### Registering a Service as Dynamic

Registering a service as dynamic is covered in its own section. For details on how to register and use dynamic services, see the [Dynamic Registration](#dynamic-registration) section.

### Resolving a Service

There are three methods for resolving a service, and one method for checking whether a service can be resolved.

:::info
Before resolving any service, the container **must be initialized** by calling and awaiting `init()`.
:::

#### `resolve`

Returns the service if found, `null` otherwise:

```ts
const logger = await container.resolve(Logger);
if (logger) {
    logger.log("Logger is available");
}
```

#### `resolveOr`

Returns the service if found, otherwise returns the provided default value:

```ts
const logger = await container.resolveOr(Logger, new ConsoleLogger());
logger.log("Always has a logger");
```

#### `resolveOrFail`

Returns the service if found, otherwise throws `CanNotResolveServiceDiError`:

```ts
// Throws CanNotResolveServiceDiError if Logger is not registered
const logger = await container.resolveOrFail(Logger);
```

#### `has`

Returns `true` if the token can be resolved, or `false` otherwise.

```ts
if (await container.has(Logger)) {
    console.log("Logger is resolvable");
}
```

:::info
The method `has()` checks whether a service **can be resolved**, not whether it is registered.
:::

:::warning
Calling `has()` may invoke service factories as a side effect.
:::

### Scoped Execution

The `run()` method creates an isolated scope where scoped services are resolved once and then discarded.

```ts
import { LIFETIME } from "eridu-tech/di/contracts";

class A {
    // ...
}

// Register a scoped service
container.registerFactory({
    token: A,
    deps: {},
    factory: () => new A(),
    lifetime: LIFETIME.SCOPED,
});

await container.init();
await container.run({
    scope: async () => {
        // Scoped services are resolved once within this scope
        const a1 = await container.resolveOrFail(A);
        const a2 = await container.resolveOrFail(A);

        console.log(a1 === a2); // true

        // A nested scope creates a new scoped registry, so it gets its own
        // instance of the scoped service
        await container.run({
            scope: async () => {
                const nestedA = await container.resolveOrFail(A);
                console.log(nestedA === a1); // false
            },
        });
    },
});

// Outside the scope, scoped services are no longer available
// A new scope would create new instances
```

:::info
Before calling `run()`, the container **must be initialized** by calling and awaiting `init()`.
:::

### Dynamic Registration

Use `registerDynamic()` when a token's value is not known at registration time and must be provided later at runtime — for example, values derived from an incoming request:

```ts
const REQUEST_ID = genericToken<string>("RequestId");

// Register as dynamic — value will be provided later
container.registerDynamic(REQUEST_ID);
```

Dynamic values are set at runtime using the `IDynamicServiceRegister` interface, inside a scoped [`run()`](#scoped-execution) execution:

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
        const requestId = await container.resolve(REQUEST_ID);
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
            value: {
                dynamicValue: (executionContext) => {
                    // Compute the value using the execution context
                    return (
                        executionContext.get("correlationId") ??
                        crypto.randomUUID()
                    );
                },
            },
        });
    },
    scope: async () => {
        const requestId = await container.resolveOrFail(REQUEST_ID);
        console.log(`Handling request: ${requestId}`);
    },
});
```

### Lifetime Relationship

The container validates the lifetime relationships between a service and its declared dependencies, enforcing the rules described below. Any relationship not listed above throws `InvalidGraphDiError`.

| Service lifetime | Can depend on service lifetimes             |
| ---------------- | ------------------------------------------- |
| **Singleton**    | **Singleton**                               |
| **Scoped**       | **Singleton**, **Scoped** or **Dynamic**    |
| **Transient**    | **Singleton**, **Scoped**                   |
| **Dynamic**      | **None** — Dynamic can not depend on others |

:::info
The current implementation of `IContainer` will validate the dependency graph at `init()` or when a service is overridden with [`overrideFactory()`](#overriding-registrations).
If any invalid relationship is found, `InvalidGraphDiError` will be thrown.
:::

:::info
Only a **Scoped** service can depend on a **Dynamic** service. A **Transient** service cannot depend directly on a **Dynamic** service.
A **Dynamic** service cannot depend on others, even on other **Dynamic** services.
:::

Example of a valid relationship — a transient service depending on a singleton service:

```ts
import { LIFETIME } from "eridu-tech/di/contracts";

container.registerFactory({
    token: Database,
    factory: () => new Database(),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

// ✅ Service is registered as `LIFETIME.TRANSIENT`
// and its `db` dependency is `LIFETIME.SINGLETON`
container.registerFactory({
    token: UserRepository,
    factory: ({ db }) => new UserRepository(db),
    deps: { db: Database },
    lifetime: LIFETIME.TRANSIENT,
});

// container.init() will not throw InvalidGraphDiError
```

Example of an invalid relationship — a singleton service depending on a transient service:

```ts
import { LIFETIME } from "eridu-tech/di/contracts";

container.registerFactory({
    token: TransientService,
    factory: () => new TransientService(),
    deps: {},
    lifetime: LIFETIME.TRANSIENT,
});

// ❌ Service is registered as `LIFETIME.SINGLETON`
// and its `transient` dependency is `LIFETIME.TRANSIENT`
container.registerFactory({
    token: SingletonService,
    factory: ({ transient }) => new SingletonService(transient),
    deps: { transient: TransientService },
    lifetime: LIFETIME.SINGLETON,
});

// container.init() will throw InvalidGraphDiError
```

### Container Hooks

You can register multiple initialization hooks by calling `onContainerInit()` multiple times, and multiple de-initialization hooks by calling `onContainerDeInit()` multiple times. Initialization hooks run when `container.init()` is called, while de-initialization hooks run when `container.deInit()` is called.

Both callbacks for `onContainerInit()` and `onContainerDeInit()` receive an object that can be used to resolve services with `resolve`, `resolveOr`, `resolveOrFail` and check resolvability with `has`.

:::info
Hooks must be registered before `container.init()` is called. Calling `onContainerInit()` or `onContainerDeInit()` after `container.init()` throws [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

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

### Overriding Registrations

To override a registered service factory, use `overrideFactory()`; to override a registered singleton value, use `overrideValue()`. A service can only be overridden once. If the token is not registered, is registered as dynamic, or has already been overridden, a [`CanNotOverrideServiceDiError`](#cannotoverrideservicedierror) is thrown.

:::tip
We recommend using overrides only during testing, not in production code. Overriding is useful for mocking services or swapping implementations. For example, replacing a real database with an in-memory adapter.
:::

:::info
Overriding a registration is **forbidden after the container is initialized**. Calling `overrideFactory()` or `overrideValue()` after `container.init()` throws [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

```ts
// Override a registered factory service
container.overrideFactory({
    token: IDATABASE,
    factory: async (_deps, _executionContext) => {
        // Return a mock database for testing
        return new MockDatabase();
    },
    deps: {},
});

// Override a registered singleton value
container.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://localhost:9999", timeout: 100 },
});
```

### Forking a Container

The `fork()` method creates a child container that inherits all registrations and overrides from the parent at the moment of forking. After that, the two containers are fully isolated: registering or overriding services in the child does not affect the parent, and registering or overriding services in the parent does not affect the child.

:::tip
We recommend using forking only during testing. It is useful for testing different adapters by having one common base container and a fork for each adapter.
:::

:::info
Forking is forbidden after the container is initialized. Calling `fork()` after `container.init()` throws [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

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

### Errors

Most errors expose an error flag via the `flag` class field, along with detailed context via the `info` class field.

| Error                                                           | Description                                                             |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`CanNotResolveServiceDiError`](#cannotresolveservicedierror)   | Thrown when a service cannot be resolved.                               |
| [`InvalidGraphDiError`](#invalidgraphdierror)                   | Thrown when the service graph is invalid.                               |
| [`CanNotRegisterServiceDiError`](#cannotregisterservicedierror) | Thrown when a service cannot be registered.                             |
| [`CanNotOverrideServiceDiError`](#cannotoverrideservicedierror) | Thrown when a registration cannot be overridden.                        |
| [`InvalidMethodCallDiError`](#invalidmethodcalldierror)         | Thrown when a container method is called at an invalid time or context. |

#### `CanNotRegisterServiceDiError`

Thrown when a service cannot be registered. It has the following flag:

| Flag                 | Description                                       |
| -------------------- | ------------------------------------------------- |
| `ALREADY_REGISTERED` | Thrown when the token already has a registration. |

Here is an example where `CanNotRegisterServiceDiError` is thrown.

```ts
import { CanNotRegisterServiceDiError } from "eridu-tech/di/contracts";

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

// Throws CanNotRegisterServiceDiError because CONFIG token is already registered
container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://another.example.com", timeout: 3000 },
});
```

#### `InvalidGraphDiError`

Thrown when the service graph is invalid. It has the following flags:

| Flag                        | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `INVALID_EDGE_RELATIONSHIP` | Thrown when a service depends on another service with an incompatible lifetime. |
| `CYCLE_DEPENDENCY`          | Thrown when there is a dependency cycle among services.                         |
| `UNDECLARED_DEPENDENCIES`   | Thrown when a declared dependency is not registered.                            |

Here is an example where `InvalidGraphDiError` is thrown.

```ts
import { LIFETIME } from "eridu-tech/di/contracts";

container.registerFactory({
    token: SingletonService,
    factory: ({ transient }) => new SingletonService(transient),
    deps: { transient: TransientService },
    lifetime: LIFETIME.SINGLETON,
});

container.registerFactory({
    token: TransientService,
    factory: () => new TransientService(),
    deps: {},
    lifetime: LIFETIME.TRANSIENT,
});

// Throws InvalidGraphDiError because a singleton depends on a transient service
await container.init();
```

#### `CanNotResolveServiceDiError`

Thrown when a service cannot be resolved. It has the following flags:

| Flag                                 | Description                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `NOT_REGISTERED_TOKEN`               | Thrown when the token is not registered.                                                             |
| `SCOPED_SERVICE_OUTSIDE_RUN`         | Thrown when a scoped service is resolved outside a [`run()`](#scoped-execution) scope.                                    |
| `DYNAMIC_SERVICE_OUTSIDE_RUN`        | Thrown when a dynamic service is resolved outside a [`run()`](#scoped-execution) scope.                                   |
| `TRANSIENT_SERVICE_DEPEND_ON_SCOPED` | Thrown when a transient service depends on a scoped service and is resolved outside a [`run()`](#scoped-execution) scope. |
| `RESOLVED_VALUE_IS_NULL`             | Thrown when the resolved value is `null`.                                                            |
| `NO_DYNAMIC_VALUE_SET_FOR_TOKENS`    | Thrown when a dynamic token has no value set.                                                        |

```ts
import { CanNotResolveServiceDiError } from "eridu-tech/di/contracts";

// Throws CanNotResolveServiceDiError because Logger is not registered
await container.resolveOrFail(Logger);
```

#### `CanNotOverrideServiceDiError`

Thrown when a registration cannot be overridden. It has the following flags:

| Flag                   | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `TOKEN_NOT_REGISTERED` | Thrown when the token is not registered.                                 |
| `DYNAMIC_TOKEN`        | Thrown when the token is registered as dynamic and cannot be overridden. |
| `ALREADY_OVERRIDDEN`   | Thrown when the token has already been overridden.                       |

Here is an example where `CanNotOverrideServiceDiError` is thrown.

```ts
import { CanNotOverrideServiceDiError } from "eridu-tech/di/contracts";

// Throws CanNotOverrideServiceDiError because CONFIG token is not registered
// and hence cannot be overridden
container.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://localhost:9999", timeout: 100 },
});
```

#### `InvalidMethodCallDiError`

Thrown when a container method is called at an invalid time or context. It has the following flags:

| Flag                          | Description                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| `NOT_ACTIVE`                  | Thrown when a method is called while the container is not active (not initialized). |
| `ALREADY_INITIALIZED`         | Thrown when a registration method is called after the container was initialized.    |
| `INSIDE_RUN`                  | Thrown when a method is called inside a [`run()`](#scoped-execution) scope where it is not allowed.      |
| `INSIDE_DYNAMIC_REGISTRATION` | Thrown when a method is called inside the `dynamicRegistration` callback.           |
| `OUTSIDE_RUN`                 | Thrown when a method is called outside a [`run()`](#scoped-execution) scope where a scope is required.   |

Here is an example where `InvalidMethodCallDiError` is thrown.

```ts
import { InvalidMethodCallDiError } from "eridu-tech/di/contracts";
await container.init();

// Throws InvalidMethodCallDiError because registration is attempted after init()
container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://another.example.com", timeout: 3000 },
});
```

## Patterns

### Separating Registration and Resolution Concerns

The container exposes several contracts that separate concerns for different use cases:

- `IServiceRegister` — for **registering** services ([`registerFactory`](#registerfactory), [`registerValue`](#registervalue), [`registerDynamic`](#dynamic-registration), [`registerProvider`](#registerprovider)) and registering container lifecycle hooks.
- `IServiceResolver` — for **resolving** services ([`resolve`](#resolve), [`resolveOr`](#resolveor), [`resolveOrFail`](#resolveorfail), [`has`](#has)).
- `IServiceOverrider` — for **overriding** existing registrations ([`overrideFactory`](#overriding-registrations), [`overrideValue`](#overriding-registrations)), useful for testing.
- `IContainerScope` — for running scoped container executions ([`run`](#scoped-execution)).
- `IContainerFork` — for **forking** a child container ([`fork`](#forking-a-container)), useful for testing.
- `IDynamicServiceRegister` — for setting dynamic values at runtime ([`set`](#dynamic-registration)).

#### `IServiceRegister`

- [`registerFactory(settings)`](#registerfactory)
- [`registerValue(settings)`](#registervalue)
- [`registerDynamic(token)`](#dynamic-registration)
- [`registerProvider(provider)`](#registerprovider)
- [`onContainerInit(handler)`](#container-hooks)
- [`onContainerDeInit(handler)`](#container-hooks)

#### `IServiceResolver`

- [`resolve(token)`](#resolve)
- [`resolveOr(token, defaultValue)`](#resolveor)
- [`resolveOrFail(token)`](#resolveorfail)
- [`has(token)`](#has)

#### `IServiceOverrider`

- [`overrideFactory(settings)`](#overriding-registrations)
- [`overrideValue(settings)`](#overriding-registrations)

#### `IContainerScope`

- [`run(settings)`](#scoped-execution)

#### `IContainerFork`

- [`fork()`](#forking-a-container)

### Further Information

For further information refer to [`eridu-tech/di`](https://eridu-tech.github.io/eridu-tech-core/modules/DI.html) API docs.

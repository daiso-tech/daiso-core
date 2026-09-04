---
slug: /components/di
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

To begin using the DI container, create a `Container` instance and provide an [`IExecutionContext`](../execution_context/execution_context.md):

```ts file=./samples/container.ts

```

## DI Basics

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

#### Generic token

Example of a generic token created with the `genericToken` method:

```ts file=./samples/generic_token.ts

```

The `Database` service interface:

```ts file=./samples/idatabase.ts

```



#### Class constructor token
Example of a class constructor used as a token:

```ts file=./samples/class_constructor_token.ts

```

The `Database` class:

```ts file=./samples/database.ts

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

- **`factory`** — [`invocable`](utilities/invocable.md) (function or object with `invoke` method) that creates and returns the service instance. It receives a record of resolved dependencies as its first argument and the [`execution context`](../execution_context/execution_context.md) as its second argument. The factory can also be `async` and return a `Promise`.

- **`lifetime`** — The lifetime of the service. Must be either `LIFETIME.SINGLETON`, `LIFETIME.TRANSIENT` or `LIFETIME.SCOPED`.



Here is a simple example of `registerFactory()` with no dependencies:

```ts file=./samples/register_factory_no_dependencies.ts

```

The `UserProvider` service used below depends on the `Database` service:

```ts file=./samples/user_provider.ts

```

Here is a simple example of `registerFactory()` with one dependency:

```ts file=./samples/register_factory_with_dependency.ts

```

The `REQUEST_ID` token:

```ts file=./samples/request_id.ts

```

Here is an example of `registerFactory()` that reads a value from the `executionContext`:

```ts file=./samples/register_factory_execution_context.ts

```

Here is an example of a service factory defined as an object with an `invoke` method.

```ts file=./samples/service_factory_object_invoke.ts

```

#### `registerValue`

The `CONFIG` token:

```ts file=./samples/app_config.ts

```

Use `registerValue()` to register values as singletons.

```ts file=./samples/register_value.ts

```

#### `registerProvider`

Use `registerProvider()` to encapsulate a group of related registrations into a reusable, isolated code block. A service provider can be either:

- A plain **function** that receives an `IServiceRegister` to register services.
- A **class** with an `invoke(register: IServiceRegister)` method.

The `Logger` services:

```ts file=./samples/logger.ts

```

```ts file=./samples/register_provider.ts

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

```ts file=./samples/resolve.ts

```

#### `resolveOr`

Returns the service if found, otherwise returns the provided default value:

```ts file=./samples/resolve_or.ts

```

#### `resolveOrFail`

Returns the service if found, otherwise throws `CanNotResolveServiceDiError`:

```ts file=./samples/resolve_or_fail.ts

```

#### `has`

Returns `true` if the token can be resolved, or `false` otherwise.

```ts file=./samples/has.ts

```

:::info
The method `has()` checks whether a service **can be resolved**, not whether it is registered.
:::

:::warning
Calling `has()` may invoke service factories as a side effect.
:::

### Scoped

The `run()` method creates an isolated scope where scoped services are resolved once and then discarded.

```ts file=./samples/scoped_execution.ts

```

:::info
Before calling `run()`, the container **must be initialized** by calling and awaiting `init()`.
:::

### Dynamic

Use `registerDynamic()` when a token's value is not known at registration time and must be provided later at runtime — for example, values derived from an incoming request:

```ts file=./samples/register_dynamic.ts

```

Dynamic values are set at runtime using the `IDynamicServiceRegister` interface, inside a scoped [`run()`](#scoped-execution) execution. 

```ts file=./samples/dynamic_value_set.ts

```

The `RequestHandler`:

```ts file=./samples/request_handler.ts

```

`IDynamicServiceRegister` exposes `get()`, `getOrFail()` and `has()` to retrieve values from the execution context, alongside `set` which stores a value in it.

For example, `CORRELATION_ID` is another dynamic token (registered with `registerDynamic()`) whose value may already be present in the execution context:

```ts file=./samples/dynamic_value_callback.ts

```

`IDynamicServiceRegister` also provide following methods: `getOrFail()` throws `CanNotResolveServiceDiError` when no value is available, and `has()` lets you check for a value without reading it.

The methods `get()`, `has()` and `getOrFail()` only consider a token as existing when it is **registered as dynamic** **and** has a value in the execution context. if the token is not registered as dynamic, or it is registered as dynamic but has no value in the execution context it will not considered as existing.

:::warning
`set()` writes the value **directly to the execution context**. If the token already has a value in the execution context, that value is **implicitly overwritten**. If the token does not exist in the execution context yet, the value is stored with the token as key.
:::

:::info
Dynamic values are **saved to and retrieved from the execution context**. `set()` stores the value in the execution context, while `get()`, `has()` and `getOrFail` read it from there.
:::

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

```ts file=./samples/valid_relationship_transient_singleton.ts

```

The dependency chain used below:

```ts file=./samples/dependency_chain.ts

```

Example of an invalid relationship — a singleton service depending on a transient service:

```ts file=./samples/invalid_relationship_singleton_transient.ts

```

### Container Hooks

You can register multiple initialization hooks by calling `onContainerInit()` multiple times, and multiple de-initialization hooks by calling `onContainerDeInit()` multiple times. Initialization hooks run when `container.init()` is called, while de-initialization hooks run when `container.deInit()` is called.

Both callbacks for `onContainerInit()` and `onContainerDeInit()` receive an object that can be used to resolve services with `resolve`, `resolveOr`, `resolveOrFail` and check resolvability with `has`.

:::info
Hooks must be registered before `container.init()` is called. Calling `onContainerInit()` or `onContainerDeInit()` after `container.init()` throws [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

```ts file=./samples/container_hooks.ts

```

### Overriding Registrations

To override a registered service factory, use `overrideFactory()`; to override a registered singleton value, use `overrideValue()`. A service can only be overridden once. If the token is not registered, is registered as dynamic, or has already been overridden, a [`CanNotOverrideServiceDiError`](#cannotoverrideservicedierror) is thrown.

:::tip
We recommend using overrides only during testing, not in production code. Overriding is useful for mocking services or swapping implementations. For example, replacing a real database with an in-memory adapter.
:::

:::info
Overriding a registration is **forbidden after the container is initialized**. Calling `overrideFactory()` or `overrideValue()` after `container.init()` throws [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

```ts file=./samples/override_registrations.ts

```

### Forking a Container

The `fork()` method creates a child container that inherits all registrations and overrides from the parent at the moment of forking. After that, the two containers are fully isolated: registering or overriding services in the child does not affect the parent, and registering or overriding services in the parent does not affect the child.

:::tip
We recommend using forking only during testing. It is useful for testing different adapters by having one common base container and a fork for each adapter.
:::

:::info
Forking is forbidden after the container is initialized. Calling `fork()` after `container.init()` throws [`InvalidMethodCallDiError`](#invalidmethodcalldierror).
:::

```ts file=./samples/fork_container.ts

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

Thrown when a service cannot be registered. It has the following flags:

| Flag                                                         | Description                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `ALREADY_REGISTERED`                                         | Thrown when the token already has a registration.                                    |
| `DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_IS_NOT_DYNAMIC` | Thrown when the token provided to a dynamic service provider is not a dynamic token. |
| `DYNAMIC_SERVICE_PROVIDER_REGISTRATION_TOKEN_DO_NOT_EXIST`   | Thrown when the token provided to a dynamic service provider does not exist.         |

Here is an example where `CanNotRegisterServiceDiError` is thrown.

```ts file=./samples/error_can_not_register_service.ts

```

#### `InvalidGraphDiError`

Thrown when the service graph is invalid. It has the following flags:

| Flag                        | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `INVALID_EDGE_RELATIONSHIP` | Thrown when a service depends on another service with an incompatible lifetime. |
| `CYCLE_DEPENDENCY`          | Thrown when there is a dependency cycle among services.                         |
| `UNDECLARED_DEPENDENCIES`   | Thrown when a declared dependency is not registered.                            |

Here is an example where `InvalidGraphDiError` is thrown.

```ts file=./samples/error_invalid_graph.ts

```

#### `CanNotResolveServiceDiError`

Thrown when a service cannot be resolved. It has the following flags:

| Flag                                                        | Description                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `NOT_REGISTERED_TOKEN`                                      | Thrown when the token is not registered.                                                                                  |
| `SCOPED_SERVICE_OUTSIDE_RUN`                                | Thrown when a scoped service is resolved outside a [`run()`](#scoped-execution) scope.                                    |
| `DYNAMIC_SERVICE_OUTSIDE_RUN`                               | Thrown when a dynamic service is resolved outside a [`run()`](#scoped-execution) scope.                                   |
| `TRANSIENT_SERVICE_DEPEND_ON_SCOPED_WHO_CALLED_OUTSIDE_RUN` | Thrown when a transient service depends on a scoped service and is resolved outside a [`run()`](#scoped-execution) scope. |
| `RESOLVED_VALUE_IS_NULL`                                    | Thrown when the resolved value is `null`.                                                                                 |
| `NO_DYNAMIC_VALUE_SET_FOR_TOKENS`                           | Thrown when a dynamic token has no value set.                                                                             |
| `DYNAMIC_SERVICE_PROVIDER_NOT_DYNAMIC_TOKEN`                | Thrown when the token provided to a dynamic service provider is not a dynamic token.                                      |

```ts file=./samples/error_can_not_resolve_service.ts

```

#### `CanNotOverrideServiceDiError`

Thrown when a registration cannot be overridden. It has the following flags:

| Flag                   | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `TOKEN_NOT_REGISTERED` | Thrown when the token is not registered.                                 |
| `DYNAMIC_TOKEN`        | Thrown when the token is registered as dynamic and cannot be overridden. |
| `ALREADY_OVERRIDDEN`   | Thrown when the service has already been overridden.                     |

Here is an example where `CanNotOverrideServiceDiError` is thrown.

```ts file=./samples/error_can_not_override_service.ts

```

#### `InvalidMethodCallDiError`

Thrown when a container method is called at an invalid time or context. It has the following flags:

| Flag                          | Description                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `NOT_ACTIVE`                  | Thrown when a method is called while the container is not active (not initialized).                    |
| `ALREADY_INITIALIZED`         | Thrown when a registration method is called after the container was initialized.                       |
| `INSIDE_RUN`                  | Thrown when a method is called inside a [`run()`](#scoped-execution) scope where it is not allowed.    |
| `INSIDE_DYNAMIC_REGISTRATION` | Thrown when a method is called inside the dynamic `registration` callback.                             |
| `OUTSIDE_RUN`                 | Thrown when a method is called outside a [`run()`](#scoped-execution) scope where a scope is required. |

Here is an example where `InvalidMethodCallDiError` is thrown.

```ts file=./samples/error_invalid_method_call.ts

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

## Further information

For further information refer to [`eridu-tech/di`](https://eridu-tech.github.io/eridu-tech-core/modules/DI.html) API docs.

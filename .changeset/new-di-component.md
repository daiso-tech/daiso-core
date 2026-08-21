---
"eridu-tech": minor
---

# New DI Component: Eager Dependency-Injection Container

A new dependency-injection (IoC) component is available at `eridu-tech/di`. The
`./di` package export now resolves to the **eager** container implementation
(`dist/di/implementations/eager`), and its public contract surface lives in
`eridu-tech/di/contracts`.

## What's included

- **Registrations** — `registerFactory`, `registerValue`, `registerDynamic`,
  plus `overrideFactory` / `overrideValue` for testing and `registerProvider`
  for grouped, provider-based registration.
- **Lifetimes** — `singleton`, `transient`, and `scoped`.
- **Object-literal dependencies** — factories declare dependencies as a record
  (`DepsTokens<TDeps>`) and receive a single `deps` object plus the current
  execution context: `ServiceFactory = Invocable<[deps, executionContext], ...>`.
- **Scopes & forking** — `container.run()` executes a scope in which scoped
  services resolve once, and `container.fork()` creates child containers that
  inherit registrations and overrides.
- **Graph validation** — on `init()`, the container validates the service graph
  and eagerly initializes singletons in dependency order, surfacing
  `InvalidGraphDiError` for cycles, invalid lifetime edges, and undeclared
  dependencies.

## High-level breaking changes

- **Package rebrand** — import paths move from `@daiso-tech/core/*` to
  `eridu-tech/*` (e.g. `eridu-tech/di`, `eridu-tech/di/contracts`).
- **`./di` export retargeted** — `eridu-tech/di` now points to the eager
  implementation at `dist/di/implementations/eager`.
- **Type renames in the contract surface** — `Invokable` → `Invocable`,
  `InvokableFn` → `InvocableFn`, and `IInvokableObject` → `IInvocableObject`.
  These appear in `ServiceFactory`, `DynamicValue`, `ServiceProviderFn`,
  `IServiceProvider`, `DynamicServiceProviderFn`, `IDynamicServiceProvider`,
  and `DiHook`.
- **Error class surface** — `public` modifiers were dropped from members of
  `InvalidGraphDiError`, `InvalidMethodCallDiError`, and
  `CanNotBeResolvedDiError`; their constructors are now `@internal`
  (use the `create()` factory methods instead).

## Eager container implementation

`Container` (`src/di/implementations/eager/container.ts`) is a lifecycle state
machine (`uninitialized` → `active` → `terminated`) that:

- builds the service graph via `GraphManager` and validates it on `init()`;
- eagerly initializes singletons (and resolves scoped/transient values) in
  dependency order using Kahn's algorithm (`eagerInitialization`);
- tracks run-scope depth and per-scope registries through the execution context
  (`RegistryManager` + `DynamicServiceRegister`);
- invokes factories, hooks, and providers via `callInvocable`.

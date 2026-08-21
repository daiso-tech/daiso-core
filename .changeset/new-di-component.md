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

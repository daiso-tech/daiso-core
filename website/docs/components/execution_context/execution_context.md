---
slug: /components/execution_context
tags:
    - Utilities
keywords:
    - Utilities
---

# ExecutionContext

The `eridu-tech/execution-context` module provides a type-safe, composable, and environment-agnostic way to store and propagate contextual data (such as request IDs, user info, or tracing metadata) across async boundaries and function calls. `IExecutionContext` uses symbols internally for reliable context isolation.

## Initial configuration

To begin using the execution-context, you'll need to create and configure an instance:

```ts file=./samples/initial_config.ts
```

## ExecutionContext basics

### Running code with context

You can run code within a context boundary, and all context values will be accessible throughout the call chain:

```ts file=./samples/run.ts
```

### Binding functions to context

You can bind a function to the current context, so it always executes with the captured context values:

```ts file=./samples/bind.ts
```

## Patterns

### Type safety with context tokens

You can enforce compile-time type safety by defining context tokens with specific types:

```ts file=./samples/type_safety.ts
```

### Immutable and chainable context operations

All context mutation methods return the context instance, allowing for method chaining:

```ts file=./samples/chainable.ts
```

### Conditional context updates

You can conditionally update the context:

```ts file=./samples/conditional.ts
```

### Adapters

- **`AlsExecutionContextAdapter`**: Uses Node.js AsyncLocalStorage for async context propagation.
- **`NoOpExecutionContextAdapter`**: No-op adapter for testing or environments without async context support.

### Separating reading, updating, and execution concerns

The library includes several contracts that separate concerns for different use cases:

- `IReadableContext`: Read-only access to context values (safe for consumers that should not mutate context).
- `IContext`: Adds all mutation methods (put, update, remove, etc.) for full context management.
- `IExecutionContextBase`: Adds execution boundary methods (run, bind) for context propagation and isolation.
- `IExecutionContext`: Combines all of the above for complete context management and execution.

#### `IExecutionContextBase`

- `run(invocable)` — Runs a function within the current execution-context. All context values are accessible during execution.
- `bind(fn)` — Returns a new function that, when called, executes the original function within the captured context.

#### `IContext`

- `add(token, value)` — Adds a value only if it doesn't already exist. No-op if the key exists.
- `put(token, value)` — Sets or overwrites a value for the token.
- `putIncrement(token, settings?)` — Initializes (if missing) and increments a numeric value. Optional max cap.
- `putDecrement(token, settings?)` — Initializes (if missing) and decrements a numeric value. Optional min floor.
- `putPush(token, ...values)` — Initializes (if missing) and pushes values to an array.
- `update(token, value)` — Updates a value only if it exists. No-op if missing.
- `updateIncrement(token, settings?)` — Increments a numeric value only if it exists. Optional max cap.
- `updateDecrement(token, settings?)` — Decrements a numeric value only if it exists. Optional min floor.
- `updatePush(token, ...values)` — Pushes values to an array only if it exists. No-op if missing.
- `remove(token)` — Removes a value from the context.
- `when(condition, ...invocables)` — Conditionally applies operations if the condition is true.

#### `IReadableContext`

- `contains(token, matchValue)` — Checks if an array context value contains a specific item or matches a predicate.
- `exists(token)` — Checks if a value exists for the token.
- `missing(token)` — Checks if a value is missing for the token.
- `get(token)` — Retrieves a value or null if not found.
- `getOr(token, defaultValue)` — Retrieves a value or returns the provided default if not found.
- `getOrFail(token)` — Retrieves a value or throws if not found.

## Further information

For further information refer to [`eridu-tech/execution-context`](https://eridu-tech.github.io/eridu-tech-core/modules/ExecutionContext.html) API docs.

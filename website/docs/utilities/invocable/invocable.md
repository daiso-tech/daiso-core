# Invocable

An [`Invocable`](https://eridu-tech.github.io/eridu-tech-core/types/Utilities.Invocable.html) represents a callable entity, which can be either:

1. A function `InvocableFn`
2. An object with a specific invocation signature (`IInvocableObject`)

## Types

- `Invocable` - Union type of `InvocableFn` and `IInvocableObject`
- `InvocableFn` - Function signature
- `IInvocableObject` - Object with `invoke` method

## Function Invocable (`InvocableFn`)

Represents a standard function with typed parameters and return value.

```typescript file=./samples/fn.ts
```

## Object Invocable (`IInvocableObject`)

An object that implements a callable contract through an invoke method. This pattern is especially useful for dependency injection (DI) integration, as most DI frameworks are adapted for class-based resolution.

```ts file=./samples/object.ts
```

## Further information

For further information refer to [`eridu-tech/utilities`](https://eridu-tech.github.io/eridu-tech-core/types/Utilities.Invocable.html) API docs.

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

```typescript
import type { InvocableFn } from "eridu-tech/utilities";

// Using InvocableFn
type AddFunction = InvocableFn<[arg1: number, arg2: number], number>;

// Equivalent to:
type TraditionalFunction = (arg1: number, arg2: number) => number;
```

## Object Invocable (`IInvocableObject`)

An object that implements a callable contract through an invoke method. This pattern is especially useful for dependency injection (DI) integration, as most DI frameworks are adapted for class-based resolution.

```ts
import type { IInvocableObject } from "eridu-tech/utilities";

class InvocableObject implements IInvocableObject<
    [arg1: number, arg2: number],
    number
> {
    invoke(arg1: number, arg2: number): number {
        throw new Error("Method not implemented.");
    }
}

const invocableObject: IInvocableObject<[arg1: number, arg2: number], number> =
    {
        invoke(arg1: number, arg2: number): number {
            throw new Error("Method not implemented.");
        },
    };
```

## Further information

For further information refer to [`eridu-tech/utilities`](https://eridu-tech.github.io/eridu-tech-core/types/Utilities.Invocable.html) API docs.

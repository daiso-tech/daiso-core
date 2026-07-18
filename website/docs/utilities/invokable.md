# Invokable

An [`Invokable`](https://daiso-tech.github.io/daiso-core/types/Utilities.Invokable.html) represents a callable entity, which can be either:

1. A function `InvokableFn`
2. An object with a specific invocation signature (`IInvokableObject`)

## Types

- `Invokable` - Union type of `InvokableFn` and `IInvokableObject`
- `InvokableFn` - Function signature
- `IInvokableObject` - Object with `invoke` method

## Function Invokable (`InvokableFn`)

Represents a standard function with typed parameters and return value.

```typescript
import type { InvokableFn } from "@daiso-tech/core/utilities";

// Using InvokableFn
type AddFunction = InvokableFn<[arg1: number, arg2: number], number>;

// Equivalent to:
type TraditionalFunction = (arg1: number, arg2: number) => number;
```

## Object Invokable (`IInvokableObject`)

An object that implements a callable contract through an invoke method. This pattern is especially useful for dependency injection (DI) integration, as most DI frameworks are adapted for class-based resolution.

```ts
import type { IInvokableObject } from "@daiso-tech/core/utilities";

class InvokableObject implements IInvokableObject<
    [arg1: number, arg2: number],
    number
> {
    invoke(arg1: number, arg2: number): number {
        throw new Error("Method not implemented.");
    }
}

const invokableObject: IInvokableObject<[arg1: number, arg2: number], number> =
    {
        invoke(arg1: number, arg2: number): number {
            throw new Error("Method not implemented.");
        },
    };
```

## Further information

For further information refer to [`@daiso-tech/core/utilities`](https://daiso-tech.github.io/daiso-core/types/Utilities.Invokable.html) API docs.

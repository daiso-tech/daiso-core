# ErrorPolicy type

The `ErrorPolicy` type determines which errors should be handled for example in resilience middlewares like [`retry`](../components/resilience.md) or [`fallback`](../components/resilience.md).

## Predicate as ErrorPolicy

A predicate function can be used to dynamically determine if an error should be handled:

```ts
import { fallback } from "@daiso-tech/core/resilience";
import { useFactory } from "@daiso-tech/core/middleware";

class CustomError extends Error {
    constructor(
        readonly errorCode: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = CustomError.name;
    }
}
const use = useFactory();
const func = use((): string => {
    return "asd";
}, [
    fallback({
        fallbackValue: "DEFAULT_VALUE",
        errorPolicy: (error) => error instanceof CustomError,
    }),
]);

await func();
```

## Classes as ErrorPolicy:

You can directly pass an class to match if errors are instance of the class:

```ts
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();
const func = use((): string => {
    return "asd";
}, [
    fallback({
        fallbackValue: "DEFAULT_VALUE",
        errorPolicy: CustomError,
    }),
]);

await func();
```

You can also pass multiple error classes:

```ts
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();
const func = use((): string => {
    return "asd";
}, [
    fallback({
        fallbackValue: "DEFAULT_VALUE",
        errorPolicy: [CustomErrorA, CustomErrorB],
    }),
]);

await func();
```

## Standard Schema as ErrorPolicy

You can use any [standard schema](https://standardschema.dev/) as error policy:

```ts
import { z } from "zod";
import { useFactory } from "@daiso-tech/core/middleware";

const use = useFactory();
const func = use((): string => {
    return "asd";
}, [
    fallback({
        fallbackValue: "DEFAULT_VALUE",
        errorPolicy: z.object({
            code: z.literal("e20"),
            message: z.string(),
        }),
    }),
]);

await func();
```

## False return values as error

You can treat false return values as errors. This useful when you want to retry functions that return boolean.

```ts
import { useFactory } from "@daiso-tech/core/middleware";
import { retry } from "@daiso-tech/core/resilience";

const use = useFactory();
const func = use((): Promise<boolean> => {
    // Will be
    console.log("EXECUTING");
    return false;
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: {
            treatFalseAsError: true,
        },
    }),
]);

await func();
```

## Further information

For further information refer to [`@daiso-tech/core/utilities`](https://daiso-tech.github.io/daiso-core/types/Utilities.ErrorPolicy.html) API docs.

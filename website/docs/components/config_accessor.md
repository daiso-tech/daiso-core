---
tags:
    - Utilities
keywords:
    - Utilities
---

# ConfigAccessor

The `@daiso-tech/core/config-accessor` component provides standardized type-safe access to domain configuration variables. It supports optional schema validation useful accessing dynamic configurations (e.g tenneat configurations).

## ConfigAccessor class

### Initial configuration

```ts
import { ConfigAccessor } from "@daiso-tech/core/config-accessor";
import { z } from "zod";

const config = {};

const schema = z.object({
    // Suppports primtive string, number, boolean values
    a: z.string(),

    // Suppports nested object with fields of string, number, boolean values
    b: z.object({
        a: z.string(),
    }),

    // Suppports array with item of string, number, boolean values
    c: z.string().array(),

    // Suppports array of object with fields of string, number, boolean values
    d: z
        .object({
            a: z.string(),
        })
        .array(),
});

const accessor = new ConfigAccessor({
    config,
    // Schema is optional, you can pass in a type
    schema,
});
```

### Accessing configuration variables

#### get

Will return null if path is missing:

```ts
// Return the value of field a
accessor.get("a");

// Return the value of field b which is an object
accessor.get("b");

// Return the value of field b.a which is an primtive
accessor.get("b.a");

// Return the first item of field c wich an primtive
accessor.get("c.1");

// Return the first item of field d which an object
accessor.get("d.2");
```

:::info
Note you can only access fields up to 2 levels deep.
:::

#### getOr

Will return default value if path is missing:

```ts
accessor.getOr("a", "");
```

## IConfigAccessor contract

```ts
type FieldConfigValue = string | number | boolean;

type BaseConfig = Partial<
    Record<
        string,
        OneOrArray<FieldConfigValue | Partial<Record<string, FieldConfigValue>>>
    >
>;

type IConfigAccessor<TConfig extends BaseConfig = BaseConfig> = {
    get<TPath extends RestrictedPaths<TConfig>>(
        path: TPath,
    ): PathValue<TConfig, TPath>;

    getOr<TPath extends RestrictedPaths<TConfig>>(
        path: TPath,
        defaultValue: NonNullable<Get<TConfig, TPath>>,
    ): NonNullable<PathValue<TConfig, TPath>>;
};
```

## Further information

For further information refer to [`@daiso-tech/core/config-accessor`](https://daiso-tech.github.io/daiso-core/modules/ConfigAccessor.html) API docs.

---
slug: /components/config_accessor
tags:
    - Utilities
keywords:
    - Utilities
---

# Config accessor

The `eridu-tech/config-accessor` component provides standardized type-safe access to domain configuration variables. It supports optional schema validation useful accessing dynamic configurations (e.g tenneat configurations).

## ConfigAccessor class

### Initial configuration

```ts file=./samples/initial_config.ts
```

### Accessing configuration variables

#### get

Will return null if path is missing:

```ts file=./samples/get.ts
```

:::info
Note you can only access fields up to 2 levels deep.
:::

#### getOr

Will return default value if path is missing:

```ts file=./samples/get_or.ts
```

## IConfigAccessor contract

```ts file=./samples/contract.ts
```

## Further information

For further information refer to [`eridu-tech/config-accessor`](https://eridu-tech.github.io/eridu-tech-core/modules/ConfigAccessor.html) API docs.

---
slug: /components/env_accessor
tags:
    - Utilities
keywords:
    - Utilities
---

# Env accessor

The `eridu-tech/env-accessor` component provides easy type-safe access to enviroment variables.
It supports multiple sources (sync/async), schema validation, and convenient access patterns.

## EnvAccessor class

### Initial configuration

```ts file=./env_accessor-samples/env_accessor_initial_config.ts
```

### Accessing enviroment variables

#### get

Will return null if PORT enviroment field is missing:

```ts file=./env_accessor-samples/env_accessor_get.ts
```

#### getOr

Will return default value if NODE_ENV enviroment field is missing:

```ts file=./env_accessor-samples/env_accessor_get_or.ts
```

## IEnvAccessor contract

The `IEnvAccessor` contract defines the contract for environment variable access. It provides type-safe methods for retrieving environment variables.

```ts file=./env_accessor-samples/env_accessor_contract.ts
```

## Further information

For further information refer to [`eridu-tech/env-accessor`](https://eridu-tech.github.io/eridu-tech-core/modules/EnvAccessor.html) API docs.

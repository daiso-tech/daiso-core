---
tags:
    - Utilities
keywords:
    - Utilities
---

# Env accessor

The `@daiso-tech/core/env-accessor` component provides easy type-safe access to enviroment variables.
It supports multiple sources (sync/async), schema validation, and convenient access patterns.

## EnvAccessor class

### Initial configuration

```ts
import { EnvAccessor } from "@daiso-tech/core/env-accessor";
import { z } from "zod";
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// Combine AWS Secrets Manager and process.env as sources
// Note: The order matters—later sources override previous ones for overlapping keys.
const secretsManager = new SecretsManagerClient({ region: "us-east-1" });
const sources = [
    process.env,
    async () => {
        const secret = await secretsManager.send(
            new GetSecretValueCommand({ SecretId: "my-app/env" }),
        );
        return JSON.parse(secret.SecretString ?? "{}");
    },
];

// Define a schema for your environment variables
const schema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.string().pipe(z.coerce.number()).default("3000"),
});

// Initialize the accessor
const accessor = new EnvAccessor({ schema, sources });
await accessor.init();
```

### Accessing enviroment variables

#### get

Will return null if PORT enviroment field is missing:

```ts
accessor.get("PORT");
```

#### getOr

Will return default value if NODE_ENV enviroment field is missing:

```ts
accessor.getOr("NODE_ENV", "DEV");
```

## IEnvAccessor contract

The `IEnvAccessor` contract defines the contract for environment variable access. It provides type-safe methods for retrieving environment variables.

```ts
type BaseEnvConfig = Partial<Record<string, string | number | boolean>>;

type IEnvAccessor<TEnvConfig extends BaseEnvConfig = BaseEnvConfig> = {
    get<TField extends keyof TEnvConfig, TValue extends TEnvConfig[TField]>(
        field: TField,
    ): UndefinedToNull<TValue>;

    getOr<TField extends keyof TEnvConfig, TValue extends TEnvConfig[TField]>(
        field: TField,
        defaultValue: Lazyable<NonNullable<TValue>>,
    ): NonNullable<TValue>;
};
```

## Further information

For further information refer to [`@daiso-tech/core/env-accessor`](https://daiso-tech.github.io/daiso-core/modules/EnvAccessor.html) API docs.

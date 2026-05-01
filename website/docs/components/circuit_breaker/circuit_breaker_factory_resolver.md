---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Circuit-breaker resolver classes
tags:
    - Circuit-breaker
    - Resolvers
keywords:
    - Circuit-breaker
    - Resolvers
---

# Circuit-breaker provider resolver classes

## pro

The `CircuitBreakerFactoryResolver` class provides a flexible way to configure and switch between different circuit-breaker adapters at runtime.

### Initial configuration

To begin using the `CircuitBreakerFactoryResolver`, You will need to register all required adapters during initialization.

```ts
import { CircuitBreakerFactoryResolver } from "@daiso-tech/core/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
    serde,
    adapters: {
        memory: new DatabaseCircuitBreakerAdapter({
            adapter: new MemoryCircuitBreakerStorageAdapter(),
        }),
        redis: new RedisCircuitBreakerAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION"),
        }),
    },
    defaultAdapter: "memory",
});
```

### Usage

#### 1. Using the default adapter

```ts
// Will apply circuit-breaker logic the default adapter which is MemoryCircuitBreakerStorageAdapter
await circuitBreakerFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts
// Will apply circuit-breaker logic using the redis adapter
await circuitBreakerFactoryResolver
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts
await circuitBreakerFactoryResolver
    .use("redis")
    .setNamespace(new Namespace(["@", "test"]))
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
```

:::info
Note that the `CircuitBreakerFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## DatabaseCircuitBreakerFactoryResolver

The `DatabaseCircuitBreakerFactoryResolver` class provides a flexible way to configure and switch between different circuit-breaker-storage adapters at runtime.

### Initial configuration

To begin using the `DatabaseCircuitBreakerFactoryResolver`, You will need to register all required adapters during initialization.

```ts
import { DatabaseCircuitBreakerFactoryResolver } from "@daiso-tech/core/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storate-adapter";
import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storate-adapter";
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const serde = new Serde(new SuperJsonSerdeAdapter());
const circuitBreakerFactoryResolver = new DatabaseCircuitBreakerFactoryResolver(
    {
        serde,
        adapters: {
            memory: new MemoryCircuitBreakerStorageAdapter(),
            sqlite: new KyselyCircuitBreakerStorageAdapter({
                kysely: new Kysely({
                    dialect: new SqliteDialect({
                        database: new Sqlite("local.db"),
                    }),
                }),
                serde,
            }),
        },
        defaultAdapter: "memory",
    },
);

// Will apply circuit-breaker logic the default adapter which is MemoryCircuitBreakerStorageAdapter
await circuitBreakerFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });

// Will apply circuit-breaker logic using the KyselyCircuitBreakerStorageAdapter
await circuitBreakerFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
```

### Usage

#### 1. Using the default adapter

```ts
// Will apply circuit-breaker logic the default adapter which is MemoryCircuitBreakerStorageAdapter
await circuitBreakerFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts
// Will apply circuit-breaker logic using the sqlite adapter
await circuitBreakerFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts
import { CountBreaker } from "@daiso-tech/core/circuit-breaker/policies";
import { constantBackoff } from "@daiso-tech/core/backoff-policies";

await circuitBreakerFactoryResolver
    .setBackoffPolicy(constantBackoff())
    .setDefaultCircuitBreakerPolicy(new CountBreaker())
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
```

:::info
Note that the `DatabaseCircuitBreakerFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/circuit-breaker`](https://daiso-tech.github.io/daiso-core/modules/CircuitBreaker.html) API docs.

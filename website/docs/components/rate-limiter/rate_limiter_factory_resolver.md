---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Rate-limiter resolver classes
tags:
    - Rate-limiter
    - Resolvers
keywords:
    - Rate-limiter
    - Resolvers
---

# Rate-limiter resolver factory classes

## RateLimiterFactoryResolver

The `RateLimiterFactoryResolver` class provides a flexible way to configure and switch between different rate-limiter adapters at runtime.

### Initial configuration

To begin using the `RateLimiterFactoryResolver`, You will need to register all required adapters during initialization.

```ts
import { RateLimiterFactoryResolver } from "@daiso-tech/core/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const rateLimiterFactoryResolver = new RateLimiterFactoryResolver({
    serde,
    adapters: {
        memory: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter(),
        }),
        redis: new RedisRateLimiterAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION"),
        }),
    },
    defaultAdapter: "memory",
});
```

### Usage

#### 1. Using the default adapter

```ts
// Will apply rate-limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
await rateLimiterFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts
// Will apply rate-limiter logic using the redis adapter
await rateLimiterFactoryResolver
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts
await rateLimiterFactoryResolver
    .setNamespace(new Namespace(["@", "test"]))
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
```

:::info
Note that the `RateLimiterFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## DatabaseRateLimiterFactoryResolver

The `DatabaseRateLimiterFactoryResolver` class provides a flexible way to configure and switch between different rate-limiter-storage adapters at runtime.

### Initial configuration

To begin using the `DatabaseRateLimiterFactoryResolver`, You will need to register all required adapters during initialization.

```ts
import { DatabaseRateLimiterFactoryResolver } from "@daiso-tech/core/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
import { KyselyRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/kysely-rate-limiter-storate-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const serde = new Serde(new SuperJsonSerdeAdapter());
const rateLimiterFactoryResolver = new DatabaseRateLimiterFactoryResolver({
    serde,
    adapters: {
        memory: new MemoryRateLimiterStorageAdapter(),
        sqlite: new KyselyRateLimiterStorageAdapter({
            kysely: new Kysely({
                dialect: new SqliteDialect({
                    database: new Sqlite("local.db"),
                }),
            }),
            serde,
        }),
    },
    defaultAdapter: "memory",
});

// Will apply rate-limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
await rateLimiterFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });

// Will apply rate-limiter logic using the KyselyRateLimiterStorageAdapter
await rateLimiterFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
```

### Usage

#### 1. Using the default adapter

```ts
// Will apply rate-limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
await rateLimiterFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts
// Will apply rate-limiter logic using the sqlite adapter
await rateLimiterFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

#### 3. Overriding default settings

```ts
import { SlidingWindowLimiter } from "@daiso-tech/core/rate-limiter/policies";
import { constantBackoff } from "@daiso-tech/core/backoff-policies";

await rateLimiterFactoryResolver
    .setBackoffPolicy(constantBackoff())
    .setRateLimiterPolicy(new SlidingWindowLimiter())
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
```

:::info
Note that the `DatabaseRateLimiterFactoryResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.

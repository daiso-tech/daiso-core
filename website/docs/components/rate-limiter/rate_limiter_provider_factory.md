---
sidebar_position: 2
sidebar_label: Factory classes
pagination_label: Rate-limiter factory classes
tags:
 - Rate-limiter
 - Factories
keywords:
 - Rate-limiter
 - Factories
---

# Rate-limiter provider factory classes

## RateLimiterProviderFactory

The `RateLimiterProviderFactory` class provides a flexible way to configure and switch between different rate-limiter adapters at runtime.

### Initial configuration

To begin using the `RateLimiterProviderFactory`, You will need to register all required adapters during initialization.

```ts
import { RateLimiterProviderFactory } from "@daiso-tech/core/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Redis from "ioredis"
  
const serde = new Serde(new SuperJsonSerdeAdapter());
const rateLimiterProviderFactory = new RateLimiterProviderFactory({
    serde,
    adapters: {
        memory: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter()
        }),
        redis: new RedisRateLimiterAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION")
        }),
    },
    defaultAdapter: "memory",
});
```

### Usage

#### 1. Using the default adapter

```ts
// Will apply rate-limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
await rateLimiterProviderFactory
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
await rateLimiterProviderFactory
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
await rateLimiterProviderFactory
  .use("redis")
  .create("a")
  .setNamespace(new Namespace(["@", "test"]))
  .runOrFail(async () => {
    // ... code to apply rate-limiter logic
  });
```

:::info
Note that the `RateLimiterProviderFactory` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## DatabaseRateLimiterProviderFactory

The `DatabaseRateLimiterProviderFactory` class provides a flexible way to configure and switch between different rate-limiter-storage adapters at runtime.

### Initial configuration

To begin using the `DatabaseRateLimiterProviderFactory`, You will need to register all required adapters during initialization.

```ts
import { DatabaseRateLimiterProviderFactory } from "@daiso-tech/core/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storate-adapter";
import { KyselyRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/kysely-rate-limiter-storate-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const serde = new Serde(new SuperJsonSerdeAdapter());
const rateLimiterProviderFactory = new DatabaseRateLimiterProviderFactory({
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
await rateLimiterProviderFactory
  .use()
  .create("a")
  .runOrFail(async () => {
    // ... code to apply rate-limiter logic
  });

// Will apply rate-limiter logic using the KyselyRateLimiterStorageAdapter
await rateLimiterProviderFactory
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
await rateLimiterProviderFactory
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
await rateLimiterProviderFactory
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
import { SlidingWindowLimiter } from "@daiso-tech/core/rate-limiter/policies"
import { constantBackoff } from "@daiso-tech/core/backoff-policies"

await rateLimiterProviderFactory
  .use("redis")
  .create("a")
  .setBackoffPolicy(constantBackoff())
  .setRateLimiterPolicy(new SlidingWindowLimiter())
  .runOrFail(async () => {
    // ... code to apply rate-limiter logic
  });
```

:::info
Note that the `DatabaseRateLimiterProviderFactory` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.


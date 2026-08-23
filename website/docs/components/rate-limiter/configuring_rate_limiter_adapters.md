---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring RateLimiter adapters
tags:
    - RateLimiter
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Mysql
    - Postgres
    - Sqlite
    - Libsql
    - NoOp
keywords:
    - RateLimiter
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Mysql
    - Postgres
    - Sqlite
    - Libsql
    - NoOp
---

# Configuring RateLimiter adapters

## RedisRateLimiterAdapter

To use the `RedisRateLimiterAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
});
```

### Configuring backoff policy

The `type` field is the only required field. All other fields are optional.

```ts
import { BACKOFFS } from "eridu-tech/backoff-policies";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
    backoffPolicy: {
        type: BACKOFFS.CONSTANT,
        delay: TimeSpan.fromSeconds(1),
        jitter: 0.5,
    },
});
```

The settings are the same as [backoff policies](../backoff_policies.md) settings.

### Configuring RateLimiter policy

The `type` field is the only required field. All other fields are optional.

```ts
import { POLICIES } from "eridu-tech/rate-limiter/policies";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
    rateLimiterPolicy: {
        type: POLICIES.SLIDING_WINDOW,
        failureThreshold: 5,
        successThreshold: 5,
    },
});
```

The settings are the same as [rate-limiter policies](./configuring_rate_limiter_policies.md) settings.

## DatabaseRateLimiterAdapter

To use the `DatabaseRateLimiterAdapter`, you'll need to use `IRateLimiterStorageAdapter`:

1. Creating `IRateLimiterStorageAdapter`:

```ts
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

const rateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter();
```

2. Creating `DatabaseRateLimiterAdapter`:

```ts
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";

const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
    adapter: rateLimiterStorageAdapter,
});
```

### Configuring backoff policy

You can use any of defined [backoff policies](../backoff_policies.md).

```ts
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { constantBackoff } from "eridu-tech/backoff-policies";

const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
    adapter: rateLimiterStorageAdapter,
    backoffPolicy: constantBackoff(),
});
```

### Configuring RateLimiter policy

You can use any of defined [rate-limiter policies](./configuring_rate_limiter_policies.md) or [create your own](./creating_rate_limiter_policies.md).

```ts
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { SlidingWindowLimiter } from "eridu-tech/rate-limiter/policies";

const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
    adapter: rateLimiterStorageAdapter,
    rateLimiterPolicy: new SlidingWindowLimiter(),
});
```

## NoOpRateLimiterAdapter

The `NoOpRateLimiterAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpRateLimiterAdapter } from "eridu-tech/rate-limiter/no-op-rate-limiter-adpater";

const noOpRateLimiterAdapter = new NoOpRateLimiterAdapter();
```

:::info
The `NoOpRateLimiterAdapter` is useful when you want to mock out or disable your [`RateLimiterProvider`](https://eridu-tech.github.io/eridu-tech/classes/RateLimiter.RateLimiterProvider.html) instance.
:::

## KyselyRateLimiterStorageAdapter

To use the `KyselyRateLimiterStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:

3. Provide a string serializer ([`ISerde`](../serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
```

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts
import { TimeSpan } from "eridu-tech/time-span";
import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const kyselyRateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
    kysely,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyRateLimiterStorageAdapter.init();
```

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts
import { TimeSpan } from "eridu-tech/time-span";
import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const database = new Pool({
    database: "DATABASE_NAME",
    host: "DATABASE_HOST",
    user: "DATABASE_USER",
    // DATABASE port
    port: 5432,
    password: "DATABASE_PASSWORD",
    max: 10,
});
const kysely = new Kysely({
    dialect: new PostgresDialect({
        pool: database,
    }),
});
const kyselyRateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
    kysely,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyRateLimiterStorageAdapter.init();
```

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts
import { TimeSpan } from "eridu-tech/time-span";
import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";

const database = createPool({
    host: "DATABASE_HOST",
    // Database port
    port: 3306,
    database: "DATABASE_NAME",
    user: "DATABASE_USER",
    password: "DATABASE_PASSWORD",
    connectionLimit: 10,
});
const kysely = new Kysely({
    dialect: new MysqlDialect({
        pool: database,
    }),
});
const kyselyRateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
    kysely,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyRateLimiterStorageAdapter.init();
```

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts
import { TimeSpan } from "eridu-tech/time-span";
import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const kyselyRateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
    kysely,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyRateLimiterStorageAdapter.init();
```

### Settings

To clean up expired rate-limiter records, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts
const kyselyRateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
    kysely,
    serde,
});

await kyselyRateLimiterStorageAdapter.init();

// Remove all expired rate-limiter records manually.
await kyselyRateLimiterStorageAdapter.removeAllExpired();
```

## MemoryRateLimiterStorageAdapter

To use the `MemoryRateLimiterStorageAdapter` you only need to create instance of it:

```ts
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

const memoryRateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter();
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

const map = new Map<any, any>();
const memoryRateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter(
    map,
);
```

:::info
`MemoryRateLimiterStorageAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

### Settings

To clean up expired rate-limiter records, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

const memoryRateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter();

// Remove all expired rate-limiter records manually.
await memoryRateLimiterStorageAdapter.removeAllExpired();
```

## MongodbRateLimiterStorageAdapter

To use the `MongodbRateLimiterStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

3. Provide a string serializer ([`ISerde`](../serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts
import { MongodbRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/mongodb-rate-limiter-storage-adapter";
import { MongoClient } from "mongodb";

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");
const mongodbRateLimiterStorageAdapter = new MongodbRateLimiterStorageAdapter({
    client,
    database,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbRateLimiterStorageAdapter.init();
```

## NoOpRateLimiterStorageAdapter

The `NoOpRateLimiterStorageAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/no-op-rate-limiter-storage-adpater";

const noOpRateLimiterStorageAdapter = new NoOpRateLimiterStorageAdapter();
```

:::info
The `NoOpRateLimiterStorageAdapter` is useful when you want to mock out or disable your [`DatabaseRateLimiterAdapter`](https://eridu-tech.github.io/eridu-tech/classes/RateLimiter.DatabaseRateLimiterAdapter.html) instance.
:::

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech/modules/RateLimiter.html) API docs.

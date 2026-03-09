---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring circuit-breaker adapters
tags:
 - Circuit-breaker
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
 - Circuit-breaker
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

# Configuring circuit-breaker adapters

## RedisCircuitBreakerAdapter

To use the `RedisCircuitBreakerAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts
import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database
});
```

### Configuring backoff policy

The `type` field is the only required field. All other fields are optional.

```ts
import { BACKOFFS } from "@daiso-tech/core/backoff-policies";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database,
    backoffPolicy: {
        type: BACKOFFS.CONSTANT,
        delay: TimeSpan.fromSeconds(1),
        jitter: 0.5,
    }
});
```

The settings are the same as [backoff policies](../backoff_policies.md) settings. 

### Configuring circuit-breaker policy

The `type` field is the only required field. All other fields are optional.

```ts
import { POLICIES } from "@daiso-tech/core/circuit-breaker/policies";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database,
    circuitBreakerPolicy: {
        type: POLICIES.CONSECUTIVE,
        failureThreshold: 5,
        successThreshold: 5,
    }
});
```

The settings are the same as [circuit-breaker policies](./configuring_circuit_breaker_policies.md) settings. 

## DatabaseCircuitBreakerAdapter

To use the `DatabaseCircuitBreakerAdapter`, you'll need to use `ICircuitBreakerStorageAdapter`:

1. Creating `ICircuitBreakerStorageAdapter`:

```ts
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";

const circuitBreakerStorageAdapter = new MemoryCircuitBreakerStorageAdapter();
```

2. Creating `DatabaseCircuitBreakerAdapter`:

```ts
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";

const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
  adapter: circuitBreakerStorageAdapter
});
```

### Configuring backoff policy

You can use any of defined [backoff policies](../backoff_policies.md).

```ts
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
import { constantBackoff } from "@daiso-tech/core/backoff-policies"

const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
  adapter: circuitBreakerStorageAdapter,
  backoffPolicy: constantBackoff()
});
```

### Configuring circuit-breaker policy

You can use any of defined [circuit-breaker policies](./configuring_circuit_breaker_policies.md) or [create your own](./creating_circuit_breaker_policies.md).

```ts
import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
import { SamplingBreaker } from "@daiso-tech/core/circuit-breaker/policies"

const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
  adapter: circuitBreakerStorageAdapter,
  circuitBreakerPolicy: new SamplingBreaker()
});
```

## NoOpCircuitBreakerAdapter

The `NoOpCircuitBreakerAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/no-op-circuit-breaker-adpater";

const noOpCircuitBreakerAdapter = new NoOpCircuitBreakerAdapter();
```

:::info
The `NoOpCircuitBreakerAdapter` is useful when you want to mock out or disable your [`CircuitBreakerProvider`](https://daiso-tech.github.io/daiso-core/classes/CircuitBreaker.CircuitBreakerProvider.html) instance.
:::

## KyselyCircuitBreakerStorageAdapter

To use the `KyselyCircuitBreakerStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:

3. Provide a string serializer ([`ISerde`](../serde.md)):

-   We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts
import { Serde } from "@daiso-tech/core/serde";
import { SuperJsonSerdeAdapter } from "@daiso-tech/core/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
```

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storage-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const kyselyCircuitBreakerStorageAdapter = new KyselyCircuitBreakerStorageAdapter({
    kysely,
    serde
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCircuitBreakerStorageAdapter.init();
```

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storage-adapter";
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
const kyselyCircuitBreakerStorageAdapter = new KyselyCircuitBreakerStorageAdapter({
    kysely,
    serde
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCircuitBreakerStorageAdapter.init();
```

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storage-adapter";
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
const kyselyCircuitBreakerStorageAdapter = new KyselyCircuitBreakerStorageAdapter({
    kysely,
    serde
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCircuitBreakerStorageAdapter.init();
```

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/kysely-circuit-breaker-storage-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const kyselyCircuitBreakerStorageAdapter = new KyselyCircuitBreakerStorageAdapter({
    kysely,
    serde
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCircuitBreakerStorageAdapter.init();
```

## MemoryCircuitBreakerStorageAdapter
To use the `MemoryCircuitBreakerStorageAdapter` you only need to create instance of it:

```ts
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";

const memoryCircuitBreakerStorageAdapter = new MemoryCircuitBreakerStorageAdapter();
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts
import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";

const map = new Map<any, any>();
const memoryCircuitBreakerStorageAdapter = new MemoryCircuitBreakerStorageAdapter(map);
```

:::info
`MemoryCircuitBreakerStorageAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

## MongodbCircuitBreakerStorageAdapter

To use the `MongodbCircuitBreakerStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

3. Provide a string serializer ([`ISerde`](../serde.md)):

-   We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts
import { MongodbCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/mongodb-circuit-breaker-storage-adapter";
import { MongoClient } from "mongodb";

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");
const mongodbCircuitBreakerStorageAdapter = new MongodbCircuitBreakerStorageAdapter({
    client,
    database,
    serde
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbCircuitBreakerStorageAdapter.init();
```

## NoOpCircuitBreakerStorageAdapter

The `NoOpCircuitBreakerStorageAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/no-op-circuit-breaker-storage-adpater";

const noOpCircuitBreakerStorageAdapter = new NoOpCircuitBreakerStorageAdapter();
```

:::info
The `NoOpCircuitBreakerStorageAdapter` is useful when you want to mock out or disable your [`DatabaseCircuitBreakerAdapter`](https://daiso-tech.github.io/daiso-core/classes/CircuitBreaker.DatabaseCircuitBreakerAdapter.html) instance.
:::

## Further information

For further information refer to [`@daiso-tech/core/circuit-breaker`](https://daiso-tech.github.io/daiso-core/modules/CircuitBreaker.html) API docs.

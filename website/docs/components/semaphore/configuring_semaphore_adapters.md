---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring semaphore adapters
tags:
    - Semaphore
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
    - Semaphore
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

# Configuring semaphore adapters

## MemorySemaphoreAdapter

To use the `MemorySemaphoreAdapter` you only need to create instance of it:

```ts
import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";

const memorySemaphoreAdapter = new MemorySemaphoreAdapter();
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts
import { MemorySemaphoreAdapter } from "@daiso-tech/core/semaphore/memory-semaphore-adapter";

const map = new Map<any, any>();
const memorySemaphoreAdapter = new MemorySemaphoreAdapter(map);
```

:::info
`MemorySemaphoreAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

:::danger
Note the `MemorySemaphoreAdapter` is limited to single process usage and cannot be shared across multiple servers or processes.
:::

## MongodbSemaphoreAdapter

To use the `MongodbSemaphoreAdapter`, you'll need to:

1. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

```ts
import { MongodbSemaphoreAdapter } from "@daiso-tech/core/semaphore/mongodb-semaphore-adapter";
import { MongoClient } from "mongodb";

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");
const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbSemaphoreAdapter.init();
```

You can change the collection name:

```ts
const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
    // By default "semaphore" is used as collection name
    collectionName: "my-semaphore",
});

await mongodbSemaphoreAdapter.init();
```

You can change the collection settings:

```ts
const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbSemaphoreAdapter.init();
```

:::info
To remove the semaphore collection and all stored semaphore data, use `deInit` method:

```ts
await mongodbSemaphoreAdapter.deInit();
```

:::

:::danger
Note in order to use `MongodbSemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## RedisSemaphoreAdapter

To use the `RedisSemaphoreAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts
import { RedisSemaphoreAdapter } from "@daiso-tech/core/semaphore/redis-semaphore-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisSemaphoreAdapter = new RedisSemaphoreAdapter(database);
```

:::danger
Note in order to use `RedisSemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## KyselySemaphoreAdapter

To use the `KyselySemaphoreAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySemaphoreAdapter } from "@daiso-tech/core/semaphore/kysely-semaphore-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
```

:::danger
Note using `KyselySemaphoreAdapter` with `sqlite` is limited to single server usage and cannot be shared across multiple servers but it can be shared between different processes. To use it correctly, ensure all process instances access the same persisted database.
:::

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySemaphoreAdapter } from "@daiso-tech/core/semaphore/kysely-semaphore-adapter";
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
const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
```

:::danger
Note in order to use `KyselySemaphoreAdapter` with `postgres` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySemaphoreAdapter } from "@daiso-tech/core/semaphore/kysely-semaphore-adapter";
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
const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
```

:::danger
Note in order to use `KyselySemaphoreAdapter` with `mysql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySemaphoreAdapter } from "@daiso-tech/core/semaphore/kysely-semaphore-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
```

:::danger
Note in order to use `KyselySemaphoreAdapter` with `libsql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use libsql embedded replicas.
:::

### Settings

Expired keys are cleared at regular intervals and you can change the interval time:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    database,
    // By default, the interval is 1 minute
    expiredKeysRemovalInterval: TimeSpan.fromSeconds(10),
});

await kyselySemaphoreAdapter.init();
```

Disabling scheduled interval cleanup of expired keys:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    database,
    shouldRemoveExpiredKeys: false,
});

await kyselySemaphoreAdapter.init();

// You can remove all expired keys manually.
await kyselySemaphoreAdapter.removeAllExpired();
```

:::info
To remove the semaphore table and all stored semaphore data, use `deInit` method:

```ts
await kyselySemaphoreAdapter.deInit();
```

:::

## NoOpSemaphoreAdapter

The `NoOpSemaphoreAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpSemaphoreAdapter } from "@daiso-tech/core/semaphore/no-op-semaphore-adapter";

const noOpSemaphoreAdapter = new NoOpSemaphoreAdapter();
```

:::info
The `NoOpSemaphoreAdapter` is useful when you want to mock out or disable your [`SemaphoreFactory`](https://daiso-tech.github.io/daiso-core/classes/Semaphore.SemaphoreFactory.html) instance.
:::

## Further information

For further information refer to [`@daiso-tech/core/semaphore`](https://daiso-tech.github.io/daiso-core/modules/Semaphore.html) API docs.

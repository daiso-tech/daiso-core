---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring lock adapters
tags:
 - Lock
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
 - Lock
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

# Configuring lock adapters

## MemoryLockAdapter

To use the `MemoryLockAdapter` you only need to create instance of it:

```ts
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";

const memoryLockAdapter = new MemoryLockAdapter();
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts
import { MemoryLockAdapter } from "@daiso-tech/core/lock/memory-lock-adapter";

const map = new Map<any, any>();
const memoryLockAdapter = new MemoryLockAdapter(map);
```

:::info
`MemoryLockAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

:::danger
Note the `MemoryLockAdapter` is limited to single process usage and cannot be shared across multiple servers or processes.
:::

## MongodbLockAdapter

To use the `MongodbLockAdapter`, you'll need to:

1. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

```ts
import { MongodbLockAdapter } from "@daiso-tech/core/lock/mongodb-lock-adapter";
import { MongoClient } from "mongodb";

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");
const mongodbLockAdapter = new MongodbLockAdapter({
    database,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbLockAdapter.init();
```

You can change the collection name:

```ts
const mongodbLockAdapter = new MongodbLockAdapter({
    database,
    // By default "lock" is used as collection name
    collectionName: "my-lock",
});

await mongodbLockAdapter.init();
```

You can change the collection settings:

```ts
const mongodbLockAdapter = new MongodbLockAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbLockAdapter.init();
```

:::info
To remove the lock collection and all stored lock data, use `deInit` method:

```ts
await mongodbLockAdapter.deInit();
```

:::

:::danger
Note in order to use `MongodbLockAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## RedisLockAdapter

To use the `RedisLockAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts
import { RedisLockAdapter } from "@daiso-tech/core/lock/redis-lock-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisLockAdapter = new RedisLockAdapter(database);
```

:::danger
Note in order to use `RedisLockAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## KyselyLockAdapter

To use the `KyselyLockAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyLockAdapter } from "@daiso-tech/core/lock/kysely-lock-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const kyselyLockAdapter = new KyselyLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyLockAdapter.init();
```

:::danger
Note using `KyselyLockAdapter` with `sqlite` is limited to single server usage and cannot be shared across multiple servers but it can be shared between different processes. To use it correctly, ensure all process instances access the same persisted database.
:::

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyLockAdapter } from "@daiso-tech/core/lock/kysely-lock-adapter";
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
const kyselyLockAdapter = new KyselyLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyLockAdapter.init();
```

:::danger
Note in order to use `KyselyLockAdapter` with `postgres` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyLockAdapter } from "@daiso-tech/core/lock/kysely-lock-adapter";
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
const kyselyLockAdapter = new KyselyLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyLockAdapter.init();
```

:::danger
Note in order to use `KyselyLockAdapter` with `mysql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselyLockAdapter } from "@daiso-tech/core/lock/kysely-lock-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const kyselyLockAdapter = new KyselyLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyLockAdapter.init();
```

:::danger
Note in order to use `KyselyLockAdapter` with `libsql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use libsql embedded replicas.
:::

### Settings

Expired keys are cleared at regular intervals and you can change the interval time:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const kyselyLockAdapter = new KyselyLockAdapter({
    database,
    // By default, the interval is 1 minute
    expiredKeysRemovalInterval: TimeSpan.fromSeconds(10),
});

await kyselyLockAdapter.init();
```

Disabling scheduled interval cleanup of expired keys:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const kyselyLockAdapter = new KyselyLockAdapter({
    database,
    shouldRemoveExpiredKeys: false,
});

await kyselyLockAdapter.init();

// You can remove all expired keys manually.
await kyselyLockAdapter.removeAllExpired();
```

:::info
To remove the lock table and all stored lock data, use `deInit` method:

```ts
await kyselyLockAdapter.deInit();
```

:::

## NoOpLockAdapter

The `NoOpLockAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpLockAdapter } from "@daiso-tech/core/lock/no-op-lock-adpater";

const noOpLockAdapter = new NoOpLockAdapter();
```

:::info
The `NoOpLockAdapter` is useful when you want to mock out or disable your [`LockFactory`](https://daiso-tech.github.io/daiso-core/classes/Lock.LockFactory.html) instance.
:::

## Further information

For further information refer to [`@daiso-tech/core/lock`](https://daiso-tech.github.io/daiso-core/modules/Lock.html) API docs.

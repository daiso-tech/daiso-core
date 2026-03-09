---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring shared-lock adapters
tags:
 - Shared-lock
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
 - Shared-lock
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

# Configuring shared-lock adapters

## MemorySharedLockAdapter

To use the `MemorySharedLockAdapter` you only need to create instance of it:

```ts
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";

const memorySharedLockAdapter = new MemorySharedLockAdapter();
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts
import { MemorySharedLockAdapter } from "@daiso-tech/core/shared-lock/memory-shared-lock-adapter";

const map = new Map<any, any>();
const memorySharedLockAdapter = new MemorySharedLockAdapter(map);
```

:::info
`MemorySharedLockAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

:::danger
Note the `MemorySharedLockAdapter` is limited to single process usage and cannot be shared across multiple servers or processes.
:::

## MongodbSharedLockAdapter

To use the `MongodbSharedLockAdapter`, you'll need to:

1. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

```ts
import { MongodbSharedLockAdapter } from "@daiso-tech/core/shared-lock/mongodb-shared-lock-adapter";
import { MongoClient } from "mongodb";

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");
const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbSharedLockAdapter.init();
```

You can change the collection name:

```ts
const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
    // By default "shared-lock" is used as collection name
    collectionName: "my-shared-lock",
});

await mongodbSharedLockAdapter.init();
```

You can change the collection settings:

```ts
const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbSharedLockAdapter.init();
```

:::info
To remove the shared-lock collection and all stored shared-lock data, use `deInit` method:

```ts
await mongodbSharedLockAdapter.deInit();
```

:::

:::danger
Note in order to use `MongodbSharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## RedisSharedLockAdapter

To use the `RedisSharedLockAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts
import { RedisSharedLockAdapter } from "@daiso-tech/core/shared-lock/redis-shared-lock-adapter";
import Redis from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisSharedLockAdapter = new RedisSharedLockAdapter(database);
```

:::danger
Note in order to use `RedisSharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## KyselySharedLockAdapter

To use the `KyselySharedLockAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySharedLockAdapter } from "@daiso-tech/core/shared-lock/kysely-shared-lock-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely({
    dialect: new SqliteDialect({
        database,
    }),
});
const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySharedLockAdapter.init();
```

:::danger
Note using `KyselySharedLockAdapter` with `sqlite` is limited to single server usage and cannot be shared across multiple servers but it can be shared between different processes. To use it correctly, ensure all process instances access the same persisted database.
:::

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySharedLockAdapter } from "@daiso-tech/core/shared-lock/kysely-shared-lock-adapter";
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
const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySharedLockAdapter.init();
```

:::danger
Note in order to use `KyselySharedLockAdapter` with `postgres` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySharedLockAdapter } from "@daiso-tech/core/shared-lock/kysely-shared-lock-adapter";
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
const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySharedLockAdapter.init();
```

:::danger
Note in order to use `KyselySharedLockAdapter` with `mysql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";
import { KyselySharedLockAdapter } from "@daiso-tech/core/shared-lock/kysely-shared-lock-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const kysely = new Kysely({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    kysely,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySharedLockAdapter.init();
```

:::danger
Note in order to use `KyselySharedLockAdapter` with `libsql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use libsql embedded replicas.
:::

### Settings

Expired keys are cleared at regular intervals and you can change the interval time:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    database,
    // By default, the interval is 1 minute
    expiredKeysRemovalInterval: TimeSpan.fromSeconds(10),
});

await kyselySharedLockAdapter.init();
```

Disabling scheduled interval cleanup of expired keys:

```ts
import { TimeSpan } from "@daiso-tech/core/time-span";

const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    database,
    shouldRemoveExpiredKeys: false,
});

await kyselySharedLockAdapter.init();

// You can remove all expired keys manually.
await kyselySharedLockAdapter.removeAllExpired();
```

:::info
To remove the shared-lock table and all stored shared-lock data, use `deInit` method:

```ts
await kyselySharedLockAdapter.deInit();
```
:::

## NoOpSharedLockAdapter

The `NoOpSharedLockAdapter` is a no-operation implementation, it performs no actions when called:

```ts
import { NoOpSharedLockAdapter } from "@daiso-tech/core/shared-lock/no-op-shared-lock-adapter";

const noOpSharedLockAdapter = new NoOpSharedLockAdapter();
```

:::info
The `NoOpSharedLockAdapter` is useful when you want to mock out or disable your [`SharedLockProvider`](https://daiso-tech.github.io/daiso-core/classes/SharedLock.SharedLockProvider.html) instance.
:::

## Further information

For further information refer to [`@daiso-tech/core/shared-lock`](https://daiso-tech.github.io/daiso-core/modules/SharedLock.html) API docs.

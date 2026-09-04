---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring Lock adapters
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

# Configuring Lock adapters

## MemoryLockAdapter

To use the `MemoryLockAdapter` you only need to create instance of it:

```ts file=./configuring_lock_adapters-samples/memory_lock_adapter.ts
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts file=./configuring_lock_adapters-samples/memory_lock_adapter_with_map.ts
```

:::info
`MemoryLockAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

:::danger
Note the `MemoryLockAdapter` is limited to single process usage and cannot be shared across multiple servers or processes.
:::

### Settings

To clean up expired lock keys, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./configuring_lock_adapters-samples/memory_lock_remove_all_expired.ts
```

:::info
To remove the lock map and all stored lock data, use `deInit` method:

```ts file=./configuring_lock_adapters-samples/memory_lock_adapter_deinit.ts
```

:::

## MongodbLockAdapter

To use the `MongodbLockAdapter`, you'll need to:

1. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

```ts file=./configuring_lock_adapters-samples/mongodb_lock_adapter.ts
```

You can change the collection name:

```ts file=./configuring_lock_adapters-samples/mongodb_lock_collection_name.ts
```

You can change the collection settings:

```ts file=./configuring_lock_adapters-samples/mongodb_lock_collection_settings.ts
```

:::info
To remove the lock collection and all stored lock data, use `deInit` method:

```ts file=./configuring_lock_adapters-samples/mongodb_lock_adapter_deinit.ts
```

:::

:::danger
Note in order to use `MongodbLockAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## RedisLockAdapter

To use the `RedisLockAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts file=./configuring_lock_adapters-samples/redis_lock_adapter.ts
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

```ts file=./configuring_lock_adapters-samples/kysely_lock_sqlite.ts
```

:::danger
Note using `KyselyLockAdapter` with `sqlite` is limited to single server usage and cannot be shared across multiple servers but it can be shared between different processes. To use it correctly, ensure all process instances access the same persisted database.
:::

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./configuring_lock_adapters-samples/kysely_lock_postgres.ts
```

:::danger
Note in order to use `KyselyLockAdapter` with `postgres` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts file=./configuring_lock_adapters-samples/kysely_lock_mysql.ts
```

:::danger
Note in order to use `KyselyLockAdapter` with `mysql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts file=./configuring_lock_adapters-samples/kysely_lock_libsql.ts
```

:::danger
Note in order to use `KyselyLockAdapter` with `libsql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use libsql embedded replicas.
:::

### Settings

To clean up expired lock keys, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./configuring_lock_adapters-samples/kysely_lock_remove_all_expired.ts
```

:::info
To remove the lock table and all stored lock data, use `deInit` method:

```ts file=./configuring_lock_adapters-samples/kysely_lock_adapter_deinit.ts
```

:::

## NoOpLockAdapter

The `NoOpLockAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./configuring_lock_adapters-samples/no_op_lock_adapter.ts
```

:::info
The `NoOpLockAdapter` is useful when you want to mock out or disable your [`LockFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/Lock.LockFactory.html) instance.
:::

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech-core/modules/Lock.html) API docs.

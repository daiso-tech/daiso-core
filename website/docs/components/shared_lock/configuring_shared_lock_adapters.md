---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring SharedLock adapters
tags:
    - SharedLock
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
    - SharedLock
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

# Configuring SharedLock adapters

## MemorySharedLockAdapter

To use the `MemorySharedLockAdapter` you only need to create instance of it:

```ts file=./configuring_shared_lock_adapters-samples/memory_shared_lock_adapter.ts
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts file=./configuring_shared_lock_adapters-samples/memory_shared_lock_adapter_with_map.ts
```

:::info
`MemorySharedLockAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

:::danger
Note the `MemorySharedLockAdapter` is limited to single process usage and cannot be shared across multiple servers or processes.
:::

### Settings

To clean up expired shared-lock keys, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./configuring_shared_lock_adapters-samples/memory_shared_lock_remove_all_expired.ts
```

:::info
To remove the shared-lock map and all stored shared-lock data, use `deInit` method:

```ts file=./configuring_shared_lock_adapters-samples/memory_shared_lock_adapter_deinit.ts
```

:::

## MongodbSharedLockAdapter

To use the `MongodbSharedLockAdapter`, you'll need to:

1. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

```ts file=./configuring_shared_lock_adapters-samples/mongodb_shared_lock_adapter.ts
```

You can change the collection name:

```ts file=./configuring_shared_lock_adapters-samples/mongodb_shared_lock_collection_name.ts
```

You can change the collection settings:

```ts file=./configuring_shared_lock_adapters-samples/mongodb_shared_lock_collection_settings.ts
```

:::info
To remove the shared-lock collection and all stored shared-lock data, use `deInit` method:

```ts file=./configuring_shared_lock_adapters-samples/mongodb_shared_lock_adapter_deinit.ts
```

:::

:::danger
Note in order to use `MongodbSharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances or processes.
:::

## RedisSharedLockAdapter

To use the `RedisSharedLockAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts file=./configuring_shared_lock_adapters-samples/redis_shared_lock_adapter.ts
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

```ts file=./configuring_shared_lock_adapters-samples/kysely_shared_lock_sqlite.ts
```

:::danger
Note using `KyselySharedLockAdapter` with `sqlite` is limited to single server usage and cannot be shared across multiple servers but it can be shared between different processes. To use it correctly, ensure all process instances access the same persisted database.
:::

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./configuring_shared_lock_adapters-samples/kysely_shared_lock_postgres.ts
```

:::danger
Note in order to use `KyselySharedLockAdapter` with `postgres` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts file=./configuring_shared_lock_adapters-samples/kysely_shared_lock_mysql.ts
```

:::danger
Note in order to use `KyselySharedLockAdapter` with `mysql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use replication.
:::

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts file=./configuring_shared_lock_adapters-samples/kysely_shared_lock_libsql.ts
```

:::danger
Note in order to use `KyselySharedLockAdapter` with `libsql` correctly, ensure you use a single, consistent database across all server instances. This means you can't use libsql embedded replicas.
:::

### Settings

To clean up expired shared-lock keys, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./configuring_shared_lock_adapters-samples/kysely_shared_lock_remove_all_expired.ts
```

:::info
To remove the shared-lock table and all stored shared-lock data, use `deInit` method:

```ts file=./configuring_shared_lock_adapters-samples/kysely_shared_lock_adapter_deinit.ts
```

:::

## NoOpSharedLockAdapter

The `NoOpSharedLockAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./configuring_shared_lock_adapters-samples/no_op_shared_lock_adapter.ts
```

:::info
The `NoOpSharedLockAdapter` is useful when you want to mock out or disable your [`SharedLockFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/SharedLock.SharedLockFactory.html) instance.
:::

## Further information

For further information refer to [`eridu-tech/shared-lock`](https://eridu-tech.github.io/eridu-tech-core/modules/SharedLock.html) API docs.

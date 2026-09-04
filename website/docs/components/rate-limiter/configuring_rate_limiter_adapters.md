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

```ts file=./configuring_rate_limiter_adapters-samples/redis_rate_limiter_adapter.ts
```

### Configuring backoff policy

The `type` field is the only required field. All other fields are optional.

```ts file=./configuring_rate_limiter_adapters-samples/redis_rate_limiter_backoff_policy.ts
```

The settings are the same as [backoff policies](../backoff_policies/backoff_policies.md) settings.

### Configuring RateLimiter policy

The `type` field is the only required field. All other fields are optional.

```ts file=./configuring_rate_limiter_adapters-samples/redis_rate_limiter_policy.ts
```

The settings are the same as [rate-limiter policies](./configuring_rate_limiter_policies.md) settings.

## DatabaseRateLimiterAdapter

To use the `DatabaseRateLimiterAdapter`, you'll need to use `IRateLimiterStorageAdapter`:

1. Creating `IRateLimiterStorageAdapter`:

```ts file=./configuring_rate_limiter_adapters-samples/rate_limiter_storage_adapter.ts
```

2. Creating `DatabaseRateLimiterAdapter`:

```ts file=./configuring_rate_limiter_adapters-samples/database_rate_limiter_adapter.ts
```

### Configuring backoff policy

You can use any of defined [backoff policies](../backoff_policies/backoff_policies.md).

```ts file=./configuring_rate_limiter_adapters-samples/database_rate_limiter_backoff_policy.ts
```

### Configuring RateLimiter policy

You can use any of defined [rate-limiter policies](./configuring_rate_limiter_policies.md) or [create your own](./creating_rate_limiter_policies.md).

```ts file=./configuring_rate_limiter_adapters-samples/database_rate_limiter_policy.ts
```

## NoOpRateLimiterAdapter

The `NoOpRateLimiterAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./configuring_rate_limiter_adapters-samples/no_op_rate_limiter_adapter.ts
```

:::info
The `NoOpRateLimiterAdapter` is useful when you want to mock out or disable your [`RateLimiterProvider`](https://eridu-tech.github.io/eridu-tech-core/classes/RateLimiter.RateLimiterProvider.html) instance.
:::

## KyselyRateLimiterStorageAdapter

To use the `KyselyRateLimiterStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:

3. Provide a string serializer ([`ISerde`](../serde/serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./configuring_rate_limiter_adapters-samples/serde_instance.ts
```

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts file=./configuring_rate_limiter_adapters-samples/kysely_storage_sqlite.ts
```

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./configuring_rate_limiter_adapters-samples/kysely_storage_postgres.ts
```

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts file=./configuring_rate_limiter_adapters-samples/kysely_storage_mysql.ts
```

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts file=./configuring_rate_limiter_adapters-samples/kysely_storage_libsql.ts
```

### Settings

To clean up expired rate-limiter records, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./configuring_rate_limiter_adapters-samples/kysely_storage_remove_all_expired.ts
```

## MemoryRateLimiterStorageAdapter

To use the `MemoryRateLimiterStorageAdapter` you only need to create instance of it:

```ts file=./configuring_rate_limiter_adapters-samples/memory_rate_limiter_storage_adapter.ts
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts file=./configuring_rate_limiter_adapters-samples/memory_rate_limiter_storage_with_map.ts
```

:::info
`MemoryRateLimiterStorageAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

### Settings

To clean up expired rate-limiter records, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./configuring_rate_limiter_adapters-samples/memory_rate_limiter_remove_all_expired.ts
```

## MongodbRateLimiterStorageAdapter

To use the `MongodbRateLimiterStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

3. Provide a string serializer ([`ISerde`](../serde/serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./configuring_rate_limiter_adapters-samples/mongodb_rate_limiter_storage_adapter.ts
```

## NoOpRateLimiterStorageAdapter

The `NoOpRateLimiterStorageAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./configuring_rate_limiter_adapters-samples/no_op_rate_limiter_storage_adapter.ts
```

:::info
The `NoOpRateLimiterStorageAdapter` is useful when you want to mock out or disable your [`DatabaseRateLimiterAdapter`](https://eridu-tech.github.io/eridu-tech-core/classes/RateLimiter.DatabaseRateLimiterAdapter.html) instance.
:::

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.

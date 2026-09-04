---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring CircuitBreaker adapters
tags:
    - CircuitBreaker
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
    - CircuitBreaker
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

# Configuring CircuitBreaker adapters

## RedisCircuitBreakerAdapter

To use the `RedisCircuitBreakerAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:

```ts file=./configuring_circuit_breaker_adapters-samples/redis_circuit_breaker_adapter.ts
```

### Configuring backoff policy

The `type` field is the only required field. All other fields are optional.

```ts file=./configuring_circuit_breaker_adapters-samples/redis_circuit_breaker_backoff_policy.ts
```

The settings are the same as [backoff policies](../backoff_policies/backoff_policies.md) settings.

### Configuring CircuitBreaker policy

The `type` field is the only required field. All other fields are optional.

```ts file=./configuring_circuit_breaker_adapters-samples/redis_circuit_breaker_policy.ts
```

The settings are the same as [circuit-breaker policies](./configuring_circuit_breaker_policies.md) settings.

## DatabaseCircuitBreakerAdapter

To use the `DatabaseCircuitBreakerAdapter`, you'll need to use `ICircuitBreakerStorageAdapter`:

1. Creating `ICircuitBreakerStorageAdapter`:

```ts file=./configuring_circuit_breaker_adapters-samples/circuit_breaker_storage_adapter.ts
```

2. Creating `DatabaseCircuitBreakerAdapter`:

```ts file=./configuring_circuit_breaker_adapters-samples/database_circuit_breaker_adapter.ts
```

### Configuring backoff policy

You can use any of defined [backoff policies](../backoff_policies/backoff_policies.md).

```ts file=./configuring_circuit_breaker_adapters-samples/database_circuit_breaker_backoff_policy.ts
```

### Configuring CircuitBreaker policy

You can use any of defined [circuit-breaker policies](./configuring_circuit_breaker_policies.md) or [create your own](./creating_circuit_breaker_policies.md).

```ts file=./configuring_circuit_breaker_adapters-samples/database_circuit_breaker_policy.ts
```

## NoOpCircuitBreakerAdapter

The `NoOpCircuitBreakerAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./configuring_circuit_breaker_adapters-samples/no_op_circuit_breaker_adapter.ts
```

:::info
The `NoOpCircuitBreakerAdapter` is useful when you want to mock out or disable your [`CircuitBreakerProvider`](https://eridu-tech.github.io/eridu-tech-core/classes/CircuitBreaker.CircuitBreakerProvider.html) instance.
:::

## KyselyCircuitBreakerStorageAdapter

To use the `KyselyCircuitBreakerStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:

3. Provide a string serializer ([`ISerde`](../serde/serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./configuring_circuit_breaker_adapters-samples/serde_instance.ts
```

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts file=./configuring_circuit_breaker_adapters-samples/kysely_storage_sqlite.ts
```

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./configuring_circuit_breaker_adapters-samples/kysely_storage_postgres.ts
```

### With Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts file=./configuring_circuit_breaker_adapters-samples/kysely_storage_mysql.ts
```

### With Libsql

You will need to install `@libsql/kysely-libsql` package:

```ts file=./configuring_circuit_breaker_adapters-samples/kysely_storage_libsql.ts
```

## MemoryCircuitBreakerStorageAdapter

To use the `MemoryCircuitBreakerStorageAdapter` you only need to create instance of it:

```ts file=./configuring_circuit_breaker_adapters-samples/memory_circuit_breaker_storage_adapter.ts
```

You can also provide an `Map` that will be used for storing the data in memory:

```ts file=./configuring_circuit_breaker_adapters-samples/memory_circuit_breaker_storage_with_map.ts
```

:::info
`MemoryCircuitBreakerStorageAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

## MongodbCircuitBreakerStorageAdapter

To use the `MongodbCircuitBreakerStorageAdapter`, you'll need to:

1. Use database provider that has support for transactions.

2. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

3. Provide a string serializer ([`ISerde`](../serde/serde.md)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./configuring_circuit_breaker_adapters-samples/mongodb_circuit_breaker_storage_adapter.ts
```

## NoOpCircuitBreakerStorageAdapter

The `NoOpCircuitBreakerStorageAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./configuring_circuit_breaker_adapters-samples/no_op_circuit_breaker_storage_adapter.ts
```

:::info
The `NoOpCircuitBreakerStorageAdapter` is useful when you want to mock out or disable your [`DatabaseCircuitBreakerAdapter`](https://eridu-tech.github.io/eridu-tech-core/classes/CircuitBreaker.DatabaseCircuitBreakerAdapter.html) instance.
:::

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.

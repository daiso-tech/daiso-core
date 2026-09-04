---
sidebar_position: 1
sidebar_label: Usage
pagination_label: SharedLock usage
tags:
    - SharedLock
    - Usage
keywords:
    - SharedLock
    - Usage
---

# SharedLock usage

The `eridu-tech/shared-lock` component provides a way for managing shared-locks (a.k.a reader writer locks) independent of underlying platform or storage.

## Initial configuration

To begin using the `SharedLockFactory` class, you'll need to create and configure an instance:

```ts file=./shared_lock_usage-samples/shared_lock_factory_initial_config.ts
```

:::info
Here is a complete list of settings for the [`SharedLockFactory`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.SharedLockFactorySettingsBase.html) class.
:::

## SharedLock basics

### Creating a shared-lock

```ts file=./shared_lock_usage-samples/shared_lock_create.ts
```

### Acquiring and releasing the shared-lock as reader

```ts file=./shared_lock_usage-samples/shared_lock_acquire_reader.ts
```

Alternatively you could write it as follows:

```ts file=./shared_lock_usage-samples/shared_lock_acquire_reader_or_fail.ts
```

:::danger
You need always to wrap the concurrent section with `try-finally` so the shared-lock get released when error occurs.
:::

### Acquiring and releasing the shared-lock as writer

```ts file=./shared_lock_usage-samples/shared_lock_acquire_writer.ts
```

Alternatively you could write it as follows:

```ts file=./shared_lock_usage-samples/shared_lock_acquire_writer_or_fail.ts
```

:::danger
You need always to wrap the critical section with `try-finally` so the shared-lock get released when error occurs.
:::

### SharedLock with custom TTL

You can provide a custom TTL for the shared-lock.

```ts file=./shared_lock_usage-samples/shared_lock_custom_ttl.ts
```

### Checking shared-lock state

You can get the shared-lock state by using the `getState` method, it returns [`ISharedLockState`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.ISharedLockState.html).

```ts file=./shared_lock_usage-samples/shared_lock_get_state.ts
```

## Patterns

### Refreshing shared-locks

The shared-lock can be refreshed by the current owner before it expires. This is particularly useful for long-running tasks,
instead of setting an excessively long TTL initially, you can start with a shorter one and use the `refreshWriter` or `refreshReader` method to set the TTL of the shared-lock:

#### As reader

```ts file=./shared_lock_usage-samples/shared_lock_refresh_reader.ts
```

#### As writer

```ts file=./shared_lock_usage-samples/shared_lock_refresh_writer.ts
```

:::warning
Note: A shared-lock must have an expiration (a `ttl` value) to be refreshed. You cannot refresh a shared-lock that was created without an expiration (with `ttl: null`)

```ts file=./shared_lock_usage-samples/shared_lock_non_refreshable.ts
```

:::

### Additional writer methods

The `releaseWriterOrFail` method is the same `releaseWriter` method but it throws an error when not enable to release the shared-lock as writer:

```ts file=./shared_lock_usage-samples/shared_lock_release_writer_or_fail.ts
```

The `refreshWriterOrFail` method is the same `refreshWriter` method but it throws an error when not enable to refresh the shared-lock as writer:

```ts file=./shared_lock_usage-samples/shared_lock_refresh_writer_or_fail.ts
```

The `runWriterOrFail` method automatically manages shared-lock acquisition and release as writer around function execution.
It calls `acquireWriterOrFail` before invoking the function and calls `releaseWriter` in a finally block, ensuring the shared-lock is always freed, even if an error occurs during execution.

```ts file=./shared_lock_usage-samples/shared_lock_run_writer_or_fail.ts
```

:::info
Note the method throws an error when the shared-lock cannot be acquired as writer.
:::

:::info
You can provide synchronous Invocable or async/promisable invocable as values for the `runWriterOrFail` method.
:::

### Additional reader methods

The `releaseReaderOrFail` method is the same `releaseReader` method but it throws an error when not enable to release the shared-lock as reader:

```ts file=./shared_lock_usage-samples/shared_lock_release_reader_or_fail.ts
```

The `refreshReaderOrFail` method is the same `refreshReader` method but it throws an error when not enable to refresh the shared-lock as reader:

```ts file=./shared_lock_usage-samples/shared_lock_refresh_reader_or_fail.ts
```

The `runReaderOrFail` method automatically manages shared-lock acquisition and release as reader around function execution.
It calls `acquireReaderOrFail` before invoking the function and calls `releaseReader` in a finally block, ensuring the shared-lock is always freed, even if an error occurs during execution.

```ts file=./shared_lock_usage-samples/shared_lock_run_reader_or_fail.ts
```

:::info
Note the method throws an error when the shared-lock cannot be acquired as reader.
:::

:::info
You can provide synchronous Invocable or async/promisable invocable as values for the `runReaderOrFail` method.
:::

### Additional methods

The `forceRelease` method releases the shared-lock regardless it its in reader or writer mode:

```ts file=./shared_lock_usage-samples/shared_lock_force_release.ts
```

### SharedLock instance variables

The `SharedLock` class exposes instance variables such as:

```ts file=./shared_lock_usage-samples/shared_lock_instance_variables.ts
```

### SharedLock id

By default the shared-lock id is autogenerated but it can also manually defined.

```ts file=./shared_lock_usage-samples/shared_lock_custom_id.ts
```

:::info
Manually defining shared-lock id is primarily useful for debugging or implementing manual resource controll by the end user.
:::

:::warning
In most cases, setting a shared-lock id is unnecessary.
:::

### Retrying acquiring shared-lock as writer by attempts

To retry acquiring shared-lock as writer you can use the [`retry`](../resilience/resilience.md) middleware.

Retrying acquiring shared-lock as writer with `acquireWriterOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_writer_acquire_or_fail.ts
```

Retrying acquiring sharedLock as writer with `acquireWriter` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_writer_acquire.ts
```

Retrying acquiring shared-lock as writer with `runWriterOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_writer_run_or_fail.ts
```

### Retrying acquiring shared-lock as reader by attempts

To retry acquiring shared-lock as reader you can use the [`retry`](../resilience/resilience.md) middleware.

Retrying acquiring shared-lock as reader with `acquireReaderOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_reader_acquire_or_fail.ts
```

Retrying acquiring sharedLock as reader with `acquireReader` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_reader_acquire.ts
```

Retrying acquiring shared-lock as reader with `runReaderOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_reader_run_or_fail.ts
```

### Retrying acquiring shared-lock as writer by interval

To retry acquiring shared-lockas as writer at regular intervals you can use the [`retryInterval`](../resilience/resilience.md) middleware.

Retrying acquiring shared-lock with `acquireWriterOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_interval_writer_acquire_or_fail.ts
```

Retrying acquiring shared-lock with `acquireWriter` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_interval_writer_acquire.ts
```

Retrying acquiring shared-lock with `runWriterOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_interval_writer_run_or_fail.ts
```

:::warning
Note using `retryInterval` middleware with shared-lock acquiring in a HTTP request handler is discouraged because it blocks the HTTP request handler causing the handler wait until the shared-lock becomes available or the timeout is reached. This will delay HTTP request handler to generate response and will make frontend app slow because of HTTP request handler.
:::

### Retrying acquiring shared-lock as reader by interval

To retry acquiring shared-lockas as reader at regular intervals you can use the [`retryInterval`](../resilience/resilience.md) middleware.

Retrying acquiring shared-lock with `acquireReaderOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_interval_reader_acquire_or_fail.ts
```

Retrying acquiring shared-lock with `acquireReader` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_interval_reader_acquire.ts
```

Retrying acquiring shared-lock with `runReaderOrFail` method:

```ts file=./shared_lock_usage-samples/shared_lock_retry_interval_reader_run_or_fail.ts
```

:::warning
Note using `retryInterval` middleware with shared-lock acquiring in a HTTP request handler is discouraged because it blocks the HTTP request handler causing the handler wait until the shared-lock becomes available or the timeout is reached. This will delay HTTP request handler to generate response and will make frontend app slow because of HTTP request handler.
:::

### Serialization and deserialization of shared-lock

SharedLocks can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the shared-lock on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a shared-lock you need pass an object that implements [`ISerderRegister`](../serde/serde.md) contract like the [`Serde`](../serde/serde.md) class to `SharedLockFactory`.

Manually serializing and deserializing the shared-lock:

```ts file=./shared_lock_usage-samples/shared_lock_manual_serialization.ts
```

:::danger
When serializing or deserializing a shared-lock, you must use the same `Serde` instances that were provided to the `SharedLockFactory`. This is required because the `SharedLockFactory` injects custom serialization logic for `ISharedLock` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the shared-lock manually.

```ts file=./shared_lock_usage-samples/shared_lock_event_bus_serialization.ts
```

### Separating shared-lock creation from manipulation

The library includes 4 additional contracts:

- [`ISharedLock`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.ISharedLock.html) - Allows only for manipulating of the shared-lock.

- [`IWriterLock`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.IWriterLock.html) - Allows only for manipulating of the shared-lock as writer.

- [`IReaderSemaphore`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.IReaderSemaphore.html) - Allows only for manipulating of the shared-lock as reader.

- [`ISharedLockFactory`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.ISharedLockFactory.html) - Allows only for creation of shared-locks.

## Further information

For further information refer to [`eridu-tech/shared-lock`](https://eridu-tech.github.io/eridu-tech-core/modules/SharedLock.html) API docs.

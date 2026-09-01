---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: Cache plugin
tags:
    - Cache
    - Plugins
keywords:
    - Cache
    - Plugins
    - withCachePrefix
    - withCacheJitter
    - withCacheSchema
    - withCacheWriteLock
---

# Cache Plugins

## withCachePrefix plugin

The Cache prefix plugin intercepts calls to a cache adapter and transparently prefixes all cache keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant systems** — Prefix keys with a tenant identifier to isolate cache data between tenants
- **Environment isolation** — Separate development, staging, and production cache data
- **Versioning** — Prefix keys with a schema version for cache invalidation across deployments
- **Module scoping** — Organize cache keys by feature or module to avoid collisions

### How it works

The `withCachePrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a cache key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method           | Key argument             | Pattern                     |
| ---------------- | ------------------------ | --------------------------- |
| `get`            | Second argument (`key`)  | `prefix + key`              |
| `getAndRemove`   | Second argument (`key`)  | `prefix + key`              |
| `add`            | Second argument (`key`)  | `prefix + key`              |
| `getOrAdd`       | Second argument (`key`)  | `prefix + key`              |
| `put`            | Second argument (`key`)  | `prefix + key`              |
| `update`         | Second argument (`key`)  | `prefix + key`              |
| `increment`      | Second argument (`key`)  | `prefix + key`              |
| `removeMany`     | Second argument (`keys`) | `keys.map(k => prefix + k)` |
| `removeByPrefix` | Second argument (`key`)  | `prefix + key`              |

Methods that do not accept a key (`removeAll`) are unaffected.

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { withCachePrefix } from "eridu-tech/cache/plugins";

const adapter = new MemoryCacheAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(adapter, withCachePrefix("tenant-42:"));
```

### Before/after behavior

**Before** — Keys are stored as-is:

```ts
adapter.get("user:123");
// -> looks up key "user:123"
```

**After** — Keys are automatically prefixed:

```ts
prefixedAdapter.get("user:123");
// -> looks up key "tenant-42:user:123"
```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

### Multiple keys — `removeMany`

The `removeMany` method receives an array of keys. The plugin maps over the array, prefixing each entry:

```ts
prefixedAdapter.removeMany(["a", "b", "c"]);
// -> prefixedAdapter.removeMany(["tenant-42:a", "tenant-42:b", "tenant-42:c"])
```

## withCacheJitter plugin

The Cache jitter plugin adds random jitter to TTL values on cache `add` and `put` operations. Applying jitter to TTLs helps prevent cache stampedes (thundering-herd problems) by staggering the expiration times of cache entries that were originally created with the same TTL.

### Use cases

- **Cache stampede prevention** — Stagger cache entry expiry times to avoid multiple concurrent cache refreshes
- **Load smoothing** — Distribute cache refresh load across time rather than having it spike at predictable intervals
- **Distributed systems** — Reduce synchronized expiration across many cache nodes or instances

### How it works

The `withCacheJitter` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on the `add` and `put` methods of the adapter. When either method is invoked, the plugin intercepts the call, applies a random jitter factor to the TTL, and forwards the modified arguments to the original method.

The jitter is calculated as a random percentage of the original TTL. For example, with the default `defaultJitter` of `0.2` (20 %), a TTL of 60 seconds will be randomly adjusted to somewhere between 48 and 72 seconds.

| Method | TTL argument   | Behaviour                        |
| ------ | -------------- | -------------------------------- |
| `add`  | Third argument | Applies random jitter to the TTL |
| `add`  | Third argument | Applies random jitter to the TTL |
| `getOrAdd`  | Third argument | Applies random jitter to the TTL |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { withCacheJitter } from "eridu-tech/cache/plugins";

const adapter = new MemoryCacheAdapter();

// Apply the jitter plugin to the adapter
const jitteredAdapter = withPlugin(adapter, withCacheJitter());
```

### Settings

| Option          | Type     | Default | Description                                                                |
| --------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `defaultJitter` | `number` | `0.2`   | The jitter factor as a ratio of the original TTL (e.g., `0.2` means ±20 %) |

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

<!-- ## withCacheSchema plugin

The Cache schema plugin validates cache values against a [standard schema](https://github.com/standard-schema/standard-schema) before storing or retrieving them. On `add`, `put`, and `update` operations, the input value is validated against the provided schema before being stored. Optionally, `get` and `getAndRemove` outputs can also be validated on retrieval to ensure data integrity.

### Use cases

- **Data integrity** — Ensure only valid data conforming to a schema is stored in the cache
- **Early error detection** — Catch malformed data at write time rather than at read time
- **Type safety** — Enforce runtime type checks alongside compile-time types
- **Defensive caching** — Validate data retrieved from shared or untrusted cache stores

### How it works

The `withCacheSchema` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on the `add`, `put`, `update`, `get`, and `getAndRemove` methods. For write operations (`add`, `put`, `update`), the value is validated before being passed to the underlying method. For read operations (`get`, `getAndRemove`), the returned value is validated after retrieval.

| Method         | When validation occurs     | Configurable                         |
| -------------- | -------------------------- | ------------------------------------ |
| `add`          | Before storing the value   | Always on                            |
| `put`          | Before storing the value   | Always on                            |
| `update`       | Before storing the value   | Always on                            |
| `get`          | After retrieving the value | Controlled by `shouldValidateOutput` |
| `getAndRemove` | After retrieving the value | Controlled by `shouldValidateOutput` |

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Cache } from "eridu-tech/cache";
import { withCacheSchema } from "eridu-tech/cache/plugins";
import { z } from "zod";

const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
});

const adapter = new MemoryCacheAdapter();

// Apply the schema plugin to the adapter
const validatedAdapter = withPlugin(
    adapter,
    withCacheSchema({ schema: UserSchema }),
);

const cache = new Cache<z.infer<typeof UserSchema>>({
    adapter: validatedAdapter,
});
```

### Settings

| Option                 | Type                  | Default      | Description                                                     |
| ---------------------- | --------------------- | ------------ | --------------------------------------------------------------- |
| `schema`               | `StandardSchemaV1<T>` | _(required)_ | A standard-schema compliant schema to validate values against   |
| `shouldValidateOutput` | `boolean`             | `true`       | Whether to validate values returned by `get` and `getAndRemove` |

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
::: -->

## withCacheWriteLock plugin

The Cache write lock plugin acquires a distributed lock before executing mutating cache operations. It wraps write operations (`add`, `put`, `update`, `increment`, `getAndRemove`, `removeMany`) with a lock acquired via an [`ILockFactory`](../lock/lock_usage.md), ensuring that concurrent writes to the same cache entry are serialised.

### Use cases

- **Concurrency control** — Prevent race conditions when multiple processes write to the same cache key
- **Distributed environments** — Coordinate writes across multiple application instances
- **Critical sections** — Ensure exclusive access for read-modify-write operations like `increment` and `update`
- **Batch safety** — Serialise operations on multiple keys in `removeMany`

### How it works

The `withCacheWriteLock` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on the selected mutating methods of the adapter. When an enhanced method is invoked, the plugin acquires a lock keyed by the cache key (or keys, for `removeMany`) before executing the operation. The lock is released automatically after the operation completes.

The lock key is derived directly from the cache key, ensuring that concurrent writes to the same cache entry are serialised while writes to different entries can proceed in parallel.

By default, all mutating methods are protected:

| Method              | Lock key source | Behaviour                                     |
| ------------------- | --------------- | --------------------------------------------- |
| `add`               | Single key      | Acquires lock for the key before adding       |
| `getOrAdd`          | Single key      | Acquires lock for the key before adding       |
| `put`               | Single key      | Acquires lock for the key before putting      |
| `update`            | Single key      | Acquires lock for the key before updating     |
| `increment`         | Single key      | Acquires lock for the key before incrementing |
| `getAndRemove`      | Single key      | Acquires lock for the key before removing     |
| `removeMany`        | Multiple keys   | Acquires locks for each key sequentially      |

Read-only methods (`get`, `removeAll`, `removeByPrefix`) are unaffected.

### Usage

```ts
import { withPlugin } from "eridu-tech/middleware";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { withCacheWriteLock } from "eridu-tech/cache/plugins";
import { MemoryLockFactory } from "eridu-tech/lock/memory-lock-factory";

const adapter = new MemoryCacheAdapter();
const lockFactory = new MemoryLockFactory();

// Apply the write lock plugin to the adapter
const lockedAdapter = withPlugin(adapter, withCacheWriteLock({ lockFactory }));
```

### Settings

| Option        | Type                               | Default                                                               | Description                                        |
| ------------- | ---------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| `lockFactory` | `ILockFactory`                     | _(required)_                                                          | A factory that creates named locks                 |
| `onlyMethods` | `Array<WithCacheWriteLockMethods>` | `["getAndRemove", "add", "put", "update", "increment", "removeMany"]` | The subset of methods to protect with a write lock |

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
For more information about lock factories, see the [Lock](../lock/lock_usage.md) documentation.
:::

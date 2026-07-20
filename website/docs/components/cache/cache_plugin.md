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
---

# Cache plugin

The Cache prefix plugin intercepts calls to a cache adapter and transparently prefixes all cache keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

## Use cases

- **Multi-tenant systems** — Prefix keys with a tenant identifier to isolate cache data between tenants
- **Environment isolation** — Separate development, staging, and production cache data
- **Versioning** — Prefix keys with a schema version for cache invalidation across deployments
- **Module scoping** — Organize cache keys by feature or module to avoid collisions

## How it works

The `withCachePrefix` function returns a [`PluginFn`](/docs/components/middleware) that calls `enhance` on each adapter method that accepts a cache key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method              | Key argument             | Pattern                     |
| ------------------- | ------------------------ | --------------------------- |
| `add`               | Second argument (`key`)  | `prefix + key`              |
| `get`               | Second argument (`key`)  | `prefix + key`              |
| `getAndRemove`      | Second argument (`key`)  | `prefix + key`              |
| `increment`         | Second argument (`key`)  | `prefix + key`              |
| `put`               | Second argument (`key`)  | `prefix + key`              |
| `removeByKeyPrefix` | Second argument (`key`)  | `prefix + key`              |
| `removeMany`        | Second argument (`keys`) | `keys.map(k => prefix + k)` |
| `update`            | Second argument (`key`)  | `prefix + key`              |

Methods that do not accept a key (`removeAll`) are unaffected.

## Usage

```ts
import { enhance } from "@daiso-tech/core/middleware";
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { withCachePrefix } from "@daiso-tech/core/cache/plugins";

const adapter = new MemoryCacheAdapter();

// Apply the prefix plugin
const prefixedAdapter = withPlugin(adapter, withCachePrefix("tenant-42:"));

// The key "my-key" is automatically prefixed to "tenant-42:my-key"
await prefixedAdapter.add(context, "my-key", "value");
await prefixedAdapter.get(context, "my-key"); // -> "value"
```

### Using with Cache class

The plugin can be applied directly to the adapter passed to the `Cache` constructor:

```ts
import { Cache } from "@daiso-tech/core/cache";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { withPlugin } from "@daiso-tech/core/middleware";
import { withCachePrefix } from "@daiso-tech/core/cache/plugins";

const adapter = new MemoryCacheAdapter();
const prefixedAdapter = withPlugin(adapter, withCachePrefix("v2:"));

const cache = new Cache({
    adapter: prefixedAdapter,
});

// All operations through `cache` will use "v2:..." keys
await cache.add("user:123", data);
```

## Before/after behavior

**Before** — Keys are stored as-is:

```
adapter.get(context, "user:123")  →  looks up key "user:123"
```

**After** — Keys are automatically prefixed:

```
adapter.get(context, "user:123")  →  looks up key "tenant:user:123"
```

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/middleware#plugin) documentation.
:::

## Multiple keys — `removeMany`

The `removeMany` method receives an array of keys. The plugin maps over the array, prefixing each entry:

```ts
adapter.removeMany(context, ["a", "b", "c"]);
// -> adapter.removeMany(context, ["prefix:a", "prefix:b", "prefix:c"])
```

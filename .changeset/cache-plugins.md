---
"@daiso-tech/core": minor
---

## Architectural Shift: Composable Cache Plugins

The cache module has undergone a significant architectural refactoring. Behaviours that were previously hard-coded into the `Cache` and `CacheResolver` implementations — schema validation, TTL jitter, and write-lock serialisation — have been extracted into standalone, composable plugins. The core `Cache` class is now a thin passthrough that delegates operations directly to the underlying `ICacheAdapter`, while optional capabilities are layered on via the middleware plugin system (`PluginFn`/`withPlugin`).

### Motivation

The previous architecture baked cross-cutting concerns like schema validation, TTL jittering, and distributed write locking directly into the `Cache` and `CacheResolver` classes. This had several drawbacks:

- **Tight coupling**: Users who wanted only one feature (e.g., schema validation) still paid the overhead of the other features.
- **Difficult to extend**: Adding new cross-cutting behaviours required modifying the core `Cache` class, increasing complexity and risk.
- **No composability**: Behaviours could not be mixed, matched, or reordered independently.
- **Testing complexity**: Core cache tests had to account for all combined behaviours.

The new plugin-based architecture solves these problems by keeping the `Cache` class focused on a single responsibility — delegating to an `ICacheAdapter` — and providing each cross-cutting behaviour as an independent `PluginFn<ICacheAdapter>` that can be composed via `withPlugin(adapter, ...plugins)`.

### New Plugin-Based Capabilities

The following behaviours are no longer built into `Cache` or `CacheResolver`. They are available as opt-in plugins that operate at the `ICacheAdapter` level:

**`withCacheJitter`** — Adds random jitter to TTL values on `add` and `put` operations to help prevent cache stampedes (thundering-herd problems).

- Configurable via `defaultJitter` (default ±20 %).
- Applied as a middleware that intercepts TTL parameters before they reach the adapter.
- `WITHOUT` this plugin, TTLs are stored as-is — no jitter is applied.
- Import path: `@daiso-tech/core/cache/plugins`

**`withCacheSchema`** — Validates cache values against a `StandardSchemaV1`-compliant schema before storing (`add`, `put`, `update`) and optionally on retrieval (`get`, `getAndRemove`).

- Controlled via `shouldValidateOutput` (default `true`).
- `WITHOUT` this plugin, no schema validation occurs — any value type is accepted.
- Import path: `@daiso-tech/core/cache/plugins`

**`withCacheWriteLock`** — Acquires a distributed lock via `ILockFactory` before executing mutating cache operations (`add`, `put`, `update`, `increment`, `getAndRemove`, `removeMany`), ensuring concurrent writes to the same cache entry are serialised.

- The set of protected methods is configurable via `onlyMethods`.
- `WITHOUT` this plugin, concurrent writes proceed without locking — the adapter's own concurrency guarantees apply.
- Import path: `@daiso-tech/core/cache/plugins`

### How the New Architecture Works

The `Cache` class (`src/cache/implementations/derivables/cache/cache.ts`) has been simplified to a thin wrapper that:

1. Accepts an `ICacheAdapter` (optionally enhanced by plugins) via `CacheSettings.adapter`.
2. Delegates every operation ( `get`, `add`, `put`, `update`, `increment`, `remove`, `clear`, etc.) directly to the adapter.
3. No longer performs schema validation, TTL jittering, or write-lock acquisition internally.

The `CacheResolver` class (`src/cache/implementations/derivables/cache-resolver/cache-resolver.ts`) has been similarly streamlined:

- Its `use()` method creates a plain `Cache` instance with no built-in plugins.
- `CacheResolverSettings` extends `CacheSettingsBase`, which now only contains `defaultTtl` and `context`.
- To use plugins with `CacheResolver`, users must apply plugins to the adapter _before_ registering it, or wrap the adapter at registration time.

The `ICache` contract (`src/cache/contracts/cache.contract.ts`) now uses inline `ttl?: ITimeSpan | null` parameters instead of the removed `CacheWriteSettings` object for `add`, `put`, `getOrAdd`, and related methods. This simplifies the API surface and aligns with the plugin philosophy — TTL manipulation is handled at the plugin/adapter level.

### Plugin Composition Pattern

Plugins are applied to an `ICacheAdapter` before passing it to `Cache`:

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache/memory-cache-adapter";
import { Cache } from "@daiso-tech/core/cache";
import { withCacheSchema } from "@daiso-tech/core/cache/plugins";
import { withCacheJitter } from "@daiso-tech/core/cache/plugins";
import { withCacheWriteLock } from "@daiso-tech/core/cache/plugins";
import { z } from "zod";

// Compose multiple plugins on the adapter
const adapter = withPlugin(
    new MemoryCacheAdapter(),
    withCacheSchema({ schema: z.string() }),
    withCacheJitter({ defaultJitter: 0.1 }),
    withCacheWriteLock({ lockFactory }),
);

// Pass the enhanced adapter to the thin Cache class
const cache = new Cache({ adapter });
```

Plugins are applied in order and wrap the adapter's methods using the `Enhance` utility. `withPluginFactory(enhanceFactory(useFactory()))` is the standard way to create a `withPlugin` function that supports method interception.

### Migration Path

Users who relied on the previous built-in schema validation, TTL jitter, or write-lock behaviour must now explicitly compose the corresponding plugins.

| Previous behaviour                      | New requirement                                               |
| --------------------------------------- | ------------------------------------------------------------- |
| Schema validation on cache reads/writes | Apply `withCacheSchema({ schema })` to the adapter            |
| TTL jitter to prevent stampedes         | Apply `withCacheJitter({ defaultJitter })` to the adapter     |
| Distributed write locking               | Apply `withCacheWriteLock({ lockFactory })` to the adapter    |
| All three behaviours combined           | Apply all three plugins via `withPlugin(adapter, p1, p2, p3)` |

**Before (built-in behaviour):**

```ts
// Schema validation and jitter were built into Cache/CacheResolver
const cache = new Cache({ adapter, schema: mySchema });
```

**After (explicit plugin composition):**

```ts
const enhancedAdapter = withPlugin(
    adapter,
    withCacheSchema({ schema: mySchema }),
    withCacheJitter(),
);
const cache = new Cache({ adapter: enhancedAdapter });
```

If you do not apply any plugins, the cache behaves as a pure passthrough — no validation, no jitter, no locking. This reduces overhead when these features are not needed.

### Refactoring Details

- **`CacheSettingsBase`**: Removed `schema` and `lockFactory` options. Now only contains `defaultTtl` and `context`.
- **`CacheResolverSettings`**: Simplified to extend the lean `CacheSettingsBase`. No longer carries schema or write-lock configuration.
- **`CacheWriteSettings`**: Removed. TTL is now passed as an inline `ITimeSpan | null` parameter directly on `add`, `put`, `getOrAdd`, etc.
- **`withCacheFactory`**: Updated to accept inline TTL parameter instead of `CacheWriteSettings`.
- **`ICache` contract**: `getOrAdd` now accepts `ttl?: ITimeSpan | null` as its third parameter instead of a `CacheWriteSettings` object.

### Fixes

- Added missing trailing comma to `getOrAdd` method signature in `ICache`.

### Tests

- Restructured `with*Prefix` test suites across all components (cache, circuit-breaker, file-storage, lock, rate-limiter, semaphore, shared-lock) for improved readability and consistency.
- New dedicated test suites for each plugin (`with-cache-jitter.test.ts`, `with-cache-schema.test.ts`, `with-cache-write-lock.test.ts`) verifying isolation and composition correctness.

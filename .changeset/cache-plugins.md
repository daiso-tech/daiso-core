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

### Breaking Changes

**Removed from `CacheSettingsBase`:**

- `schema` — use the `withCacheSchema` plugin instead.
- `lockFactory` — use the `withCacheWriteLock` plugin instead.

**Removed types:**

- `CacheWriteSettings` — TTL is now passed as an inline `ITimeSpan | null` parameter on `add`, `put`, `getOrAdd`, and related methods.

**Changed API signatures:**

- `Cache` constructor no longer accepts `schema` or `lockFactory` settings.
- `CacheResolver` no longer carries schema or write-lock configuration.
- `ICache.getOrAdd` now accepts `ttl?: ITimeSpan | null` as its third parameter instead of a `CacheWriteSettings` object.

### New Plugin-Based Capabilities

The following behaviours are no longer built into `Cache` or `CacheResolver`. They are available as opt-in plugins:

**`withCacheJitter`** — Adds random jitter to TTL values on `add` and `put` operations to help prevent cache stampedes (thundering-herd problems).

- Configurable via `defaultJitter` (default ±20 %).
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

The `Cache` class has been simplified to a thin wrapper that:

1. Accepts an `ICacheAdapter` (optionally enhanced by plugins) via `CacheSettings.adapter`.
2. Delegates every operation (`get`, `add`, `put`, `update`, `increment`, `remove`, `clear`, etc.) directly to the adapter.
3. No longer performs schema validation, TTL jittering, or write-lock acquisition internally.

### Migration

Users who relied on the previous built-in schema validation, TTL jitter, or write-lock behaviour must now explicitly compose the corresponding plugins.

| Previous behaviour                      | New requirement                                               |
| --------------------------------------- | ------------------------------------------------------------- |
| Schema validation on cache reads/writes | Apply `withCacheSchema({ schema })` to the adapter            |
| TTL jitter to prevent stampedes         | Apply `withCacheJitter({ defaultJitter })` to the adapter     |
| Distributed write locking               | Apply `withCacheWriteLock({ lockFactory })` to the adapter    |
| All three behaviours combined           | Apply all three plugins via `withPlugin(adapter, p1, p2, p3)` |

**Before (built-in behaviour):**

```ts
const cache = new Cache({ adapter, schema: mySchema });
```

**After (explicit plugin composition):**

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { withCacheSchema } from "@daiso-tech/core/cache/plugins";

const adapter = withPlugin(
    new MemoryCacheAdapter(),
    withCacheSchema({ schema: mySchema }),
);
const cache = new Cache({ adapter });
```

If you do not apply any plugins, the cache behaves as a pure passthrough — no validation, no jitter, no locking. This reduces overhead when these features are not needed.

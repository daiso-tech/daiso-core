---
"@daiso-tech/core": minor
---

Refactored the built-in namespacing system into opt-in `with*Prefix` plugins across all affected components. The `@daiso-tech/core/namespace` module (`INamespace`, `IKey`, `Namespace` class, `NoOpNamespace` class) has been removed. Key management is now simplified to plain strings, and prefixing is handled via middleware plugins when needed.

### What changed

**Removed `@daiso-tech/core/namespace` module** — The following are no longer available:
- `INamespace` contract — factory interface for creating namespaced keys
- `IKey` interface — hierarchically-organized key with namespace awareness
- `Namespace` class — configurable namespace with delimiter and root identifier support
- `NoOpNamespace` class — namespace that passes keys through unchanged

**Removed `namespace` setting** from component constructors:
- `Cache` — `CacheSettingsBase.namespace`
- `EventBus` — `EventBusSettingsBase.namespace`
- `LockFactory` — `LockFactorySettingsBase.namespace`
- `CircuitBreakerFactory`, `FileStorage`, `RateLimiterFactory`, `SemaphoreFactory`, `SharedLockFactory` — same pattern

**Simplified key types** across all components:
- Method parameters changed from `IKey` to `string`
- `removeMany(keys: Iterable<string>)` → `removeMany(keys: Array<string>)`
- Error classes (`KeyNotFoundCacheError`, `KeyExistsCacheError`, etc.) now accept `string` instead of `IKey`
- `ILockState.key` changed from `IKey` to `string`

### Replacement: `with*Prefix` plugins

Key prefixing is now opt-in via middleware plugins. Available plugins:

| Component | Plugin |
|---|---|
| cache | `withCachePrefix` |
| circuit-breaker | `withCircuitBreakerPrefix` |
| file-storage | `withFileStoragePrefix` |
| lock | `withLockPrefix` |
| rate-limiter | `withRateLimiterPrefix` |
| semaphore | `withSemaphorePrefix` |
| shared-lock | `withSharedLockPrefix` |

### Usage

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { withCachePrefix } from "@daiso-tech/core/cache/plugins";

const adapter = new MemoryCacheAdapter();
const prefixedAdapter = withPlugin(adapter, withCachePrefix("tenant-42:"));

// Keys are automatically prefixed:
await prefixedAdapter.add(context, "my-key", "value");
// Internally calls adapter.add(context, "tenant-42:my-key", "value")
```

### Migration

**If you used `Namespace` directly** — replace with a `with*Prefix` plugin on the adapter:

```diff
-import { Cache, Namespace } from "@daiso-tech/core";
-
-const cache = new Cache({
-    adapter: new MemoryCacheAdapter(),
-    namespace: new Namespace("my-app"),
-});
+import { Cache } from "@daiso-tech/core";
+import { withPlugin } from "@daiso-tech/core/middleware";
+import { withCachePrefix } from "@daiso-tech/core/cache/plugins";
+
+const adapter = withPlugin(new MemoryCacheAdapter(), withCachePrefix("my-app:"));
+const cache = new Cache({ adapter });
```

**If you imported `INamespace` or `IKey` types** — update to use plain `string` instead.

**If you were using `NoOpNamespace`** — simply omit the `namespace` setting (it was the default).

### Use cases

- **Multi-tenant systems** — Prefix keys with a tenant identifier to isolate data
- **Environment isolation** — Separate dev, staging, and production data
- **Versioning** — Prefix keys with a schema version
- **Module scoping** — Organize keys by feature to avoid collisions


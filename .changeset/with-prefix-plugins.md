---
"@daiso-tech/core": minor
---

## Architectural Shift: Composable `with*Prefix` Plugins

The built-in namespacing system has been refactored into opt-in `with*Prefix` plugins across all affected components. The `@daiso-tech/core/namespace` module has been removed entirely. Key management is now simplified to plain strings, and prefixing is handled via middleware plugins when needed.

### Motivation

The previous namespace system (`INamespace`, `IKey`, `Namespace` class) added unnecessary complexity for what is fundamentally a string-prefixing concern. Every component had to carry namespace configuration through its settings, and keys were wrapped in `IKey` objects instead of plain strings. This made the API harder to use and increased bundle size for users who didn't need namespacing.

The new approach removes the namespace abstraction entirely. Key prefixing is now an opt-in `PluginFn` applied directly to the adapter, keeping the core components simple and the API surface clean.

### Breaking Changes

**Removed `@daiso-tech/core/namespace` module:**

- `INamespace` contract
- `IKey` interface
- `Namespace` class
- `NoOpNamespace` class

**Removed `namespace` setting** from component constructors:

- `Cache` — `CacheSettingsBase.namespace`
- `EventBus` — `EventBusSettingsBase.namespace`
- `LockFactory` — `LockFactorySettingsBase.namespace`
- `CircuitBreakerFactory`, `FileStorage`, `RateLimiterFactory`, `SemaphoreFactory`, `SharedLockFactory` — same pattern

**Simplified key types** across all components:

- All method parameters changed from `IKey` to `string`
- `removeMany(keys: Iterable<string>)` changed to `removeMany(keys: Array<string>)`
- Error classes (`KeyNotFoundCacheError`, `KeyExistsCacheError`, etc.) now accept `string` instead of `IKey`
- `ILockState.key` changed from `IKey` to `string`

### New Plugin-Based Capabilities

Key prefixing is now opt-in via middleware plugins. Available plugins:

| Component       | Plugin                     | Import path                                |
| --------------- | -------------------------- | ------------------------------------------ |
| cache           | `withCachePrefix`          | `@daiso-tech/core/cache/plugins`           |
| circuit-breaker | `withCircuitBreakerPrefix` | `@daiso-tech/core/circuit-breaker/plugins` |
| file-storage    | `withFileStoragePrefix`    | `@daiso-tech/core/file-storage/plugins`    |
| lock            | `withLockPrefix`           | `@daiso-tech/core/lock/plugins`            |
| rate-limiter    | `withRateLimiterPrefix`    | `@daiso-tech/core/rate-limiter/plugins`    |
| semaphore       | `withSemaphorePrefix`      | `@daiso-tech/core/semaphore/plugins`       |
| shared-lock     | `withSharedLockPrefix`     | `@daiso-tech/core/shared-lock/plugins`     |
| event-bus       | `withEventBusPrefix`       | `@daiso-tech/core/event-bus/plugins`       |

```ts
import { withPlugin } from "@daiso-tech/core/middleware";
import { withCachePrefix } from "@daiso-tech/core/cache/plugins";

const adapter = withPlugin(
    new MemoryCacheAdapter(),
    withCachePrefix("tenant-42:"),
);

// Keys are automatically prefixed:
await adapter.add(context, "my-key", "value");
// Internally calls adapter.add(context, "tenant-42:my-key", "value")
```

### How the New Architecture Works

Instead of passing a `Namespace` instance to the component constructor, prefixing is now applied at the adapter level. The `with*Prefix` plugin intercepts key-related method calls and prepends the configured prefix before forwarding to the underlying adapter. This keeps components adapter-agnostic and makes prefixing composable with other plugins.

### Migration

**If you used `Namespace` directly**, replace with a `with*Prefix` plugin on the adapter:

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

**If you imported `INamespace` or `IKey` types**, update to use plain `string` instead.

**If you were using `NoOpNamespace`**, simply omit the `namespace` setting (it was the default).

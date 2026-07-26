---
"@daiso-tech/core": minor
---

## Execution Context Integration for All Adapters

All adapter contracts across `Cache`, `CircuitBreaker`, `EventBus`, `FileStorage`, `Lock`, `RateLimiter`, `Semaphore`, and `SharedLock` now accept an `IReadableContext` parameter as the last argument on every method. This enables passing execution-scoped metadata — such as request IDs, tenant IDs, correlation tokens, or authentication context — through the adapter layer without adding framework-specific coupling.

### Motivation

Previously, adapter methods had no standard mechanism to receive execution-scoped metadata. Users who needed to propagate context (e.g., for logging, tracing, or tenant isolation) had to implement workarounds such as storing context in closures, using global state, or threading custom parameters through non-standard extensions.

By adding `context: IReadableContext` as the final parameter on all adapter methods, the execution context becomes a first-class citizen of the adapter contract. This follows the dependency inversion principle — adapters depend on the abstract `IReadableContext` interface rather than any concrete context implementation, keeping them portable across environments.

### Breaking Changes

**All adapter methods** across the following contracts now require `context: IReadableContext` as the last positional argument:

| Contract                    | Affected Methods                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ICacheAdapter`             | `get`, `getAndRemove`, `add`, `getOrAdd`, `put`, `update`, `increment`, `removeMany`, `removeAll`, `removeByKeyPrefix`                 |
| `ILockAdapter`              | `acquire`, `release`, `forceRelease`, `refresh`, `getState`                                                                            |
| `ICircuitBreakerAdapter`    | `getState`, `trackFailure`, `trackSuccess`, `updateState`, `reset`, `isolate`                                                          |
| `IEventBusAdapter`          | `dispatch`, `addListener`, `removeListener`                                                                                            |
| `IFileStorageAdapter`       | `exists`, `getStream`, `getBytes`, `getMetaData`, `add`, `addStream`, `update`, `updateStream`, `put`, `putStream`, `copy`, `copyAndReplace`, `move`, `moveAndReplace`, `removeMany`, `removeByPrefix` |
| `IFileUrlAdapter`           | `getPublicUrl`, `getSignedDownloadUrl`, `getSignedUploadUrl`                                                                           |
| `IRateLimiterAdapter`       | `getState`, `reset`, `updateState`                                                                                                     |
| `ISemaphoreAdapter`         | `release`, `forceReleaseAll`, `refresh`, `getState`                                                                                    |
| `ISharedLockAdapter`        | `acquireWriter`, `releaseWriter`, `forceReleaseWriter`, `refreshWriter`, `releaseReader`, `forceReleaseAllReaders`, `refreshReader`, `forceRelease`, `getState` |

**Note:** `ISemaphoreAdapter.acquire` and `ISharedLockAdapter.acquireReader` accept `context` via a settings object (`SemaphoreAcquireSettings` / `SharedLockAcquireSettings`) rather than as a positional argument, due to the number of parameters involved.

### Migration

All call sites that invoke adapter methods directly must now pass a `context: IReadableContext` value as the last argument. In test environments, use `NoOpContext`:

```diff
-import { NoOpContext } from "@daiso-tech/core/execution-context";
-
-const context = new NoOpContext();
-await adapter.get(context, "myKey");
+import { NoOpContext } from "@daiso-tech/core/execution-context";
+
+const context = new NoOpContext();
+await adapter.get("myKey", context);
```

All built-in adapter implementations (`Redis*Adapter`, `Kysely*Adapter`, `Memory*Adapter`, `MongoDB*Adapter`, `NoOp*Adapter`) have already been updated to accept and propagate the context parameter.
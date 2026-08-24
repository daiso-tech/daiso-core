---
"eridu-tech": minor
---

Add `removeAllExpired` support to the in-memory adapters so expired data can be cleaned up.

Previously, each in-memory adapter used a separate `setTimeout` per key to handle expiration. This approach is not performant because it requires more memory, and as more timers are scheduled, timing drift can occur. Expired data is now only removed when `removeAllExpired` is called (for example, on a regular interval or cron job).

Affected adapters:

- `MemoryCacheAdapter`
- `MemoryLockAdapter`
- `MemoryRateLimiterStorageAdapter`
- `MemorySemaphoreAdapter`
- `MemorySharedLockAdapter`

Also includes internal refactors to the memory adapters (renaming underscore-prefixed internals) and documentation for the new `removeAllExpired` behavior.

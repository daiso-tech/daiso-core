---
"eridu-tech": minor
---

Updated the contract methods of the following adapters to remove the trailing `IReadableContext` argument:

- `ICacheAdapter`
- `ICircuitBreakerAdapter`
- `ICircuitBreakerStorageAdapter`
- `IEventBusAdapter`
- `IFileUrlAdapter`
- `IFileStorageAdapter`
- `ISignedFileStorageAdapter`
- `ILockAdapter`
- `ISemaphoreAdapter`
- `ISharedLockAdapter`
- `IRateLimiterAdapter`
- `IRateLimiterStorageAdapter`

Before this update, the `IExecutionContext` was passed to classes such as `Cache` via the constructor. These classes never used the context themselves; they only forwarded it as `IReadableContext` to the underlying adapter. This was unnecessary indirection.

After this update, an adapter that needs to be execution-context aware receives a shared `IExecutionContext` instance directly, avoiding the unnecessary indirection.
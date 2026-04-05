---
"@daiso-tech/core": minor
---

#### Integrated execution-context with the following adapters:

- `ICacheAdapter`
- `IDatabaseCacheAdapter`
- `ICircuitBreakerAdapter`
- `ICircuitBreakerStorageAdapter`
- `IEventBusAdapter`
- `IFileStorageAdapter`
- `ISignedFileStorageAdapter`
- `ILockAdapter`
- `IDatabaseLockAdapter`
- `IRateLimiterAdapter`
- `IRateLimiterStorageAdapter`
- `ISemaphoreAdapter`
- `IDatabaseSemaphoreAdapter`
- `ISharedLockAdapter`
- `IDatabaseSharedLockAdapter`

Now all this adapters take instance of `IReadableExecutionContext` as first argument.

#### Integrated execution-context with following classes:

- `Cache`
- `CircuitBreakerFactory`
- `EventBus`
- `FileStorage`
- `LockFactory`
- `RateLimiterFactory`
- `SemaphoreFactory`
- `SharedLockFactory`

Now you can pass `IExecutionContext` contract via the constructor.

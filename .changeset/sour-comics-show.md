---
"@daiso-tech/core": minor
---

Renamed following contracts and classes:

- Renamed `ILockProvider` contract to `ILockFactory`
- Renamed `ILockProviderFactory` contract to `ILockFactoryResolver`
- Renamed `LockProvider` class to `LockFactory`
- Renamed `LockProviderFactory` class to `LockFactoryResolver`
- Renamed `lockProviderTestSuite` function to `lockFactoryTestSuite`

- Renamed `ISemaphoreProvider` contract to `ISemaphoreFactory`
- Renamed `ISemaphoreProviderFactory` contract to `ISemaphoreFactoryResolver`
- Renamed `SemaphoreProvider` class to `SemaphoreFactory`
- Renamed `SemaphoreProviderFactory` class to `SemaphoreFactoryResolver`
- Renamed `semaphoreProviderTestSuite` function to `semaphoreFactoryTestSuite`

- Renamed `ISharedLockProvider` contract to `ISharedLockFactory`
- Renamed `ISharedLockProviderFactory` contract to `ISharedLockFactoryResolver`
- Renamed `SharedLockProvider` class to `SharedLockFactory`
- Renamed `SharedLockProviderFactory` class to `SharedLockFactoryResolver`
- Renamed `sharedLockProviderTestSuite` function to `sharedLockFactoryTestSuite`

- Renamed `ICacheFactory` contract to `ICacheResolver`
- Renamed `CacheFactory` class to `CacheResolver`

- Renamed `IEventBusFactory` contract to `IEventBusResolver`
- Renamed `EventBusFactory` class to `EventBusResolver`

- Renamed `IFileStorageFactory` contract to `IFileStorageResolver`
- Renamed `FileStorageFactory` class to `FileStorageResolver`

- Renamed `IFileProvider` contract to `IFileFactory`
- Renamed `FileProvider` class to `FileFactory`

- Renamed `ICircuitBreakerProvider` contract to `ICircuitBreakerFactory`
- Renamed `ICircuitBreakerProviderFactory` contract to `ICircuitBreakerFactoryResolver`
- Renamed `CircuitBreakerProvider` class to `CircuitBreakerFactory`
- Renamed `CircuitBreakerProviderFactory` class to `CircuitBreakerFactoryResolver`
- Renamed `DatabaseCircuitBreakerProviderFactory` class to `DatabaseCircuitBreakerFactoryResolver`

- Renamed `IRateLimiterProvider` contract to `IRateLimiterFactory`
- Renamed `IRateLimiterProviderFactory` contract to `IRateLimiterFactoryResolver`
- Renamed `RateLimiterProvider` class to `RateLimiterFactory`
- Renamed `RateLimiterProviderFactory` class to `RateLimiterFactoryResolver`
- Renamed `DatabaseRateLimiterProviderFactory` class to `DatabaseRateLimiterFactoryResolver`

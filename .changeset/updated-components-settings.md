---
"@daiso-tech/core": minor
---

Now you can passs both `IEventBus` or `IEventBusAdapter` to:
- `CacheSettingsBase.eventBus`
- `EventBusSettingsBase.eventBus`
- `FileStorageSettingsBase.eventBus`
- `CircuitBreakerFactorySettingsBase.eventBus`
- `RateLimiterBreakerFactorySettingsBase.eventBus`
- `LockFactorySettingsBase.eventBus`
- `SemaphoreFactorySettingsBase.eventBus`
- `SharedLockFactorySettingsBase.eventBus`

Reduces boilerplate by eliminating the need to manually initialize an `EventBus` instance.

Now you also can passs both `ILockFactoryBase`, `ILockAdapter` or `IDatabaseLockAdapter` to:

- `CacheSettingsBase.lockFactory`
- `FileStorageSettingsBase.lockFactory`

Reduces boilerplate by eliminating the need to manually initialize an `LockFactory` instance.
---
"eridu-tech": minor
---

Removed the usage of the `TimeSpan` class from the following adapter contracts, which now use `Date` for expiration/TTL values:

- `ICacheAdapter`
- `ISemaphoreAdapter`
- `ILockAdapter`
- `ISharedLockAdapter`
- `IRateLimiterAdapter`

This change decouples the contracts from other classes, making them easier to integrate with external libraries. Expiration values are now absolute, which also makes the tests less flaky.

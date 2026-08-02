---
"@daiso-tech/core": minor
---

## Simplified Database Adapter Settings

Removed the `enableTransactions`, `shouldRemoveExpiredKeys`, and `expiredKeysRemovalInterval` settings from all database-backed adapters. Database operations are now always wrapped in a transaction, and the built-in background cleanup of expired records has been removed.

### What changed

**Removed `enableTransactions` from:**

- `KyselyCacheAdapter`
- `KyselyCircuitBreakerStorageAdapter`
- `KyselyLockAdapter`
- `KyselyRateLimiterStorageAdapter`
- `KyselySemaphoreAdapter`
- `KyselySharedLockAdapter`
- `MongodbCircuitBreakerStorageAdapter`
- `MongodbRateLimiterStorageAdapter`

Every operation is now always executed inside a database transaction (with `serializable` isolation for the Kysely lock, semaphore, and shared-lock adapters), which matches the previous default behavior.

**Removed `shouldRemoveExpiredKeys` and `expiredKeysRemovalInterval` from:**

- `KyselyCacheAdapter`
- `KyselyLockAdapter`
- `KyselyRateLimiterStorageAdapter`
- `KyselySemaphoreAdapter`
- `KyselySharedLockAdapter`

The background task that periodically removed expired records is no longer started automatically.

### Migration

- Remove any `enableTransactions`, `shouldRemoveExpiredKeys`, or `expiredKeysRemovalInterval` options from adapter settings — they are no longer accepted.
- If you relied on automatic expired-key cleanup, schedule `removeAllExpired()` yourself (e.g. with a cron job or `setInterval`), as the adapters no longer run it in the background.

---
"@daiso-tech/core": minor
---

## Simplified Shared Lock Adapter Contract

The `IDatabaseSharedLockAdapter`, `IDatabaseSharedLockTransaction`, and related data contracts have been removed in favor of the simpler `ISharedLockAdapter` contract. This eliminates the transaction-based database abstraction layer, making the shared-lock adapter interface more straightforward.

### Motivation

The `IDatabaseSharedLockAdapter` contract introduced unnecessary complexity by wrapping results in `IWriterLockData`, `IReaderSemaphoreData`, and related objects, while requiring transaction support. The simpler `ISharedLockAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

### Breaking Changes

**Removed types:**

- `IDatabaseSharedLockAdapter`
- `IDatabaseSharedLockTransaction`
- `IWriterLockData`
- `IWriterLockExpirationData`
- `IReaderSemaphoreSlotExpirationData`
- `IReaderSemaphoreSlotData`
- `IReaderSemaphoreData`

**Removed test utility:**

- `databaseSharedLockAdapterTestSuite` — use `sharedLockAdapterTestSuite` instead.

**Removed classes:**

- `DatabaseSharedLockAdapter` derivable class

**Refactored adapters:**

- `KyselySharedLockAdapter` now implements `ISharedLockAdapter` directly with `acquireWriter`, `releaseWriter`, `forceReleaseWriter`, `refreshWriter`, `acquireReader`, `releaseReader`, `forceReleaseAllReaders`, `refreshReader`, `forceRelease`, and `getState` methods.

### Migration

Custom `IDatabaseSharedLockAdapter` implementations should migrate to `ISharedLockAdapter`. The new contract expects methods with the following signatures:

- `acquireWriter(context, key, lockId, ttl): Promise<boolean>`
- `releaseWriter(context, key, lockId): Promise<boolean>`
- `forceReleaseWriter(context, key): Promise<boolean>`
- `refreshWriter(context, key, lockId, ttl): Promise<boolean>`
- `acquireReader(settings: SharedLockAcquireSettings): Promise<boolean>`
- `releaseReader(context, key, slotId): Promise<boolean>`
- `forceReleaseAllReaders(context, key): Promise<boolean>`
- `refreshReader(context, key, slotId, ttl): Promise<boolean>`
- `forceRelease(context, key): Promise<boolean>`
- `getState(context, key): Promise<ISharedLockAdapterState | null>`

Use `sharedLockAdapterTestSuite` instead of `databaseSharedLockAdapterTestSuite` for testing. Replace custom `DatabaseSharedLockAdapter` subclasses with direct `ISharedLockAdapter` implementations.

---
"@daiso-tech/core": minor
---

Removed `IDatabaseSharedLockAdapter`, `IDatabaseSharedLockTransaction`, `IWriterLockData`, `IWriterLockExpirationData`, `IReaderSemaphoreSlotExpirationData`, `IReaderSemaphoreSlotData`, and `IReaderSemaphoreData` contracts, along with their `databaseSharedLockAdapterTestSuite`.

The `IDatabaseSharedLockAdapter` contract (`database-shared-lock-adapter.contract.ts`) has been removed in favor of the simpler `ISharedLockAdapter` contract. This simplifies the shared-lock adapter interface by eliminating the transaction-based database abstraction layer.

### Changes:

- **Removed**: `IDatabaseSharedLockAdapter` type contract
- **Removed**: `IDatabaseSharedLockTransaction` type contract
- **Removed**: `IWriterLockData`, `IWriterLockExpirationData`, `IReaderSemaphoreSlotExpirationData`, `IReaderSemaphoreSlotData`, and `IReaderSemaphoreData` types
- **Removed**: `databaseSharedLockAdapterTestSuite` test utility
- **Removed**: `DatabaseSharedLockAdapter` derivable class
- **Refactored**: `KyselySharedLockAdapter` (at `@daiso-tech/core/shared-lock/kysely-shared-lock-adapter`) now implements `ISharedLockAdapter` directly with `acquireWriter`, `releaseWriter`, `forceReleaseWriter`, `refreshWriter`, `acquireReader`, `releaseReader`, `forceReleaseAllReaders`, `refreshReader`, `forceRelease`, and `getState` methods

### Migration:

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

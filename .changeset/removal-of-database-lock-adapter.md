---
"@daiso-tech/core": minor
---

Removed `IDatabaseLockAdapter`, `IDatabaseLockTransaction`, and `ILockData` contracts, along with their `databaseLockAdapterTestSuite`.

The `IDatabaseLockAdapter` contract has been removed in favor of the simpler `ILockAdapter` contract. This simplifies the lock adapter interface by eliminating the transaction-based database abstraction layer.

### Changes:

- **Removed**: `IDatabaseLockAdapter` type contract
- **Removed**: `IDatabaseLockTransaction` type contract
- **Removed**: `ILockData` and `ILockExpirationData` types
- **Removed**: `databaseLockAdapterTestSuite` test utility
- **Removed**: `DatabaseLockAdapter` derivable class
- **Refactored**: `KyselyLockAdapter` (at `@daiso-tech/core/lock/kysely-lock-adapter`) now implements `ILockAdapter` directly with `acquire`, `release`, `forceRelease`, `refresh`, and `getState` methods

### Migration:

Custom `IDatabaseLockAdapter` implementations should migrate to `ILockAdapter`. The new contract expects methods with the following signatures:
- `acquire(context, key, lockId, ttl): Promise<boolean>`
- `release(context, key, lockId): Promise<boolean>`
- `forceRelease(context, key): Promise<boolean>`
- `refresh(context, key, lockId, ttl): Promise<boolean>`
- `getState(context, key): Promise<ILockAdapterState | null>`

Use `lockAdapterTestSuite` instead of `databaseLockAdapterTestSuite` for testing. Replace custom `DatabaseLockAdapter` subclasses with direct `ILockAdapter` implementations.
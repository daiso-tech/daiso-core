---
"@daiso-tech/core": minor
---

## Simplified Lock Adapter Contract

The `IDatabaseLockAdapter`, `IDatabaseLockTransaction`, and `ILockData` contracts have been removed in favor of the simpler `ILockAdapter` contract. This eliminates the transaction-based database abstraction layer, making the lock adapter interface more straightforward.

### Motivation

The `IDatabaseLockAdapter` contract introduced unnecessary complexity by wrapping results in `ILockData` / `ILockExpirationData` objects and requiring transaction support. The simpler `ILockAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

### Breaking Changes

**Removed types:**

- `IDatabaseLockAdapter`
- `IDatabaseLockTransaction`
- `ILockData`
- `ILockExpirationData`

**Removed test utility:**

- `databaseLockAdapterTestSuite` — use `lockAdapterTestSuite` instead.

**Removed classes:**

- `DatabaseLockAdapter` derivable class

**Refactored adapters:**

- `KyselyLockAdapter` now implements `ILockAdapter` directly with `acquire`, `release`, `forceRelease`, `refresh`, and `getState` methods.

### Migration

Custom `IDatabaseLockAdapter` implementations should migrate to `ILockAdapter`. The new contract expects methods with the following signatures:

- `acquire(context, key, lockId, ttl): Promise<boolean>`
- `release(context, key, lockId): Promise<boolean>`
- `forceRelease(context, key): Promise<boolean>`
- `refresh(context, key, lockId, ttl): Promise<boolean>`
- `getState(context, key): Promise<ILockAdapterState | null>`

Use `lockAdapterTestSuite` instead of `databaseLockAdapterTestSuite` for testing. Replace custom `DatabaseLockAdapter` subclasses with direct `ILockAdapter` implementations.

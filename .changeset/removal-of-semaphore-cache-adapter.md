---
"@daiso-tech/core": minor
---

Removed `IDatabaseSemaphoreAdapter`, `IDatabaseSemaphoreTransaction`, `ISemaphoreData`, `ISemaphoreSlotData`, and `ISemaphoreSlotExpirationData` contracts, along with their `databaseSemaphoreAdapterTestSuite`.

The `IDatabaseSemaphoreAdapter` contract (`database-semaphore-adapter.contract.ts`) has been removed in favor of the simpler `ISemaphoreAdapter` contract. This simplifies the semaphore adapter interface by eliminating the transaction-based database abstraction layer.

### Changes:

- **Removed**: `IDatabaseSemaphoreAdapter` type contract
- **Removed**: `IDatabaseSemaphoreTransaction` type contract
- **Removed**: `ISemaphoreData`, `ISemaphoreSlotData`, and `ISemaphoreSlotExpirationData` types
- **Removed**: `databaseSemaphoreAdapterTestSuite` test utility
- **Refactored**: `KyselySemaphoreAdapter` (at `@daiso-tech/core/semaphore/new-kysely-semaphore-adapter`) now implements `ISemaphoreAdapter` directly with `acquire`, `release`, `forceReleaseAll`, `refresh`, and `getState` methods

### Migration:

Custom `IDatabaseSemaphoreAdapter` implementations should migrate to `ISemaphoreAdapter`. The new contract expects methods with the following signatures:

- `acquire(settings: SemaphoreAcquireSettings): Promise<boolean>`
- `release(context, key, slotId): Promise<boolean>`
- `forceReleaseAll(context, key): Promise<boolean>`
- `refresh(context, key, slotId, ttl): Promise<boolean>`
- `getState(context, key): Promise<ISemaphoreAdapterState | null>`

Use `semaphoreAdapterTestSuite` instead of `databaseSemaphoreAdapterTestSuite` for testing. Replace custom `IDatabaseSemaphoreAdapter` subclasses with direct `ISemaphoreAdapter` implementations.

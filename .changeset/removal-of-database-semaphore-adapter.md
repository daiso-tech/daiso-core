---
"@daiso-tech/core": minor
---

## Simplified Semaphore Adapter Contract

The `IDatabaseSemaphoreAdapter`, `IDatabaseSemaphoreTransaction`, and related data contracts have been removed in favor of the simpler `ISemaphoreAdapter` contract. This eliminates the transaction-based database abstraction layer, making the semaphore adapter interface more straightforward.

### Motivation

The `IDatabaseSemaphoreAdapter` contract introduced unnecessary complexity by wrapping results in `ISemaphoreData`, `ISemaphoreSlotData`, and `ISemaphoreSlotExpirationData` objects and requiring transaction support. The simpler `ISemaphoreAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

### Breaking Changes

**Removed types:**

- `IDatabaseSemaphoreAdapter`
- `IDatabaseSemaphoreTransaction`
- `ISemaphoreData`
- `ISemaphoreSlotData`
- `ISemaphoreSlotExpirationData`

**Removed test utility:**

- `databaseSemaphoreAdapterTestSuite` — use `semaphoreAdapterTestSuite` instead.

**Refactored adapters:**

- `KyselySemaphoreAdapter` now implements `ISemaphoreAdapter` directly with `acquire`, `release`, `forceReleaseAll`, `refresh`, and `getState` methods.

### Migration

Custom `IDatabaseSemaphoreAdapter` implementations should migrate to `ISemaphoreAdapter`. The new contract expects methods with the following signatures:

- `acquire(settings: SemaphoreAcquireSettings): Promise<boolean>`
- `release(context, key, slotId): Promise<boolean>`
- `forceReleaseAll(context, key): Promise<boolean>`
- `refresh(context, key, slotId, ttl): Promise<boolean>`
- `getState(context, key): Promise<ISemaphoreAdapterState | null>`

Use `semaphoreAdapterTestSuite` instead of `databaseSemaphoreAdapterTestSuite` for testing. Replace custom `IDatabaseSemaphoreAdapter` subclasses with direct `ISemaphoreAdapter` implementations.

---
"@daiso-tech/core": minor
---

## Simplified Cache Adapter Contract

The `IDatabaseCacheAdapter`, `IDatabaseCacheTransaction`, and `ICacheData` contracts have been removed in favor of the simpler `ICacheAdapter` contract. This eliminates the transaction-based database abstraction layer, making the cache adapter interface more straightforward.

### Motivation

The `IDatabaseCacheAdapter` contract introduced unnecessary complexity by wrapping all results in `ICacheData` / `ICacheDataExpiration` objects and requiring transaction support. The simpler `ICacheAdapter` contract returns primitive values directly, reducing boilerplate for adapter implementors and improving runtime performance.

### Breaking Changes

**Removed types:**

- `IDatabaseCacheAdapter`
- `IDatabaseCacheTransaction`
- `ICacheData`
- `ICacheDataExpiration`

**Removed test utility:**

- `databaseCacheAdapterTestSuite` — use `cacheAdapterTestSuite` instead.

**Refactored adapters:**

- `KyselyCacheAdapter` now implements `ICacheAdapter` directly instead of `IDatabaseCacheAdapter`.

### Migration

Custom `IDatabaseCacheAdapter` implementations should migrate to `ICacheAdapter`. The new contract expects methods to return primitive values (`TType | null`, `boolean`, `void`) directly instead of wrapping results in `ICacheData` / `ICacheDataExpiration` objects. Use `cacheAdapterTestSuite` instead of `databaseCacheAdapterTestSuite` for testing.

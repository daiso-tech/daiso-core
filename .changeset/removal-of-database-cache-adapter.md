---
"@daiso-tech/core": minor
---

Removed `IDatabaseCacheAdapter`, `IDatabaseCacheTransaction`, and `ICacheData` contracts, along with their `databaseCacheAdapterTestSuite`.

The `IDatabaseCacheAdapter` contract (`database-cache-adapter.contract.ts`) has been removed in favor of the simpler `ICacheAdapter` contract. This simplifies the cache adapter interface by eliminating the transaction-based database abstraction layer.

### Changes:

- **Removed**: `IDatabaseCacheAdapter` type contract
- **Removed**: `IDatabaseCacheTransaction` type contract
- **Removed**: `ICacheData` and `ICacheDataExpiration` types
- **Removed**: `databaseCacheAdapterTestSuite` test utility
- **Refactored**: `KyselyCacheAdapter` (at `@daiso-tech/core/cache/kysely-cache-adapter`) now implements `ICacheAdapter` directly instead of `IDatabaseCacheAdapter`

### Migration:

Custom `IDatabaseCacheAdapter` implementations should migrate to `ICacheAdapter`. The contract expects methods to return primitive values (`TType | null`, `boolean`, `void`) directly instead of wrapping results in `ICacheData` / `ICacheDataExpiration` objects. Use `cacheAdapterTestSuite` instead of `databaseCacheAdapterTestSuite` for testing.

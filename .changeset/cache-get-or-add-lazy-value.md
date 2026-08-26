---
"eridu-tech": minor
---

Updated the `getOrAdd` method to support lazy value factories.

`getOrAdd` now accepts either a concrete value or an invocable function that produces the value to store, instead of only a concrete value.

- `ICacheAdapter.getOrAdd` now accepts `TType | InvocableFn<[], Promisable<TType>>` as `valueToAdd`.
- `IWritableCache.getOrAdd` (and thus `ICache.getOrAdd`) accepts an `AsyncLazyable<TType>` as `valueToAdd`.
- All built-in cache adapters (`KyselyCacheAdapter`, `MemoryCacheAdapter`, `MongodbCacheAdapter`, `NoOpCacheAdapter`, and `RedisCacheAdapter`) now resolve an invocable `valueToAdd` before storing it.
- The `Cache` derivable now resolves the `AsyncLazyable` value before delegating to the underlying adapter.

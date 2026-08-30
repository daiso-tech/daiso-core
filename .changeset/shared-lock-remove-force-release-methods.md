---
"eridu-tech": minor
---

Removed the unused force-release methods from the shared-lock component to simplify its API.

### Breaking changes

- Removed `forceReleaseWriter` from `ISharedLockAdapter` and `IWriterLock`.
- Removed `forceReleaseAllReaders` from `ISharedLockAdapter` and `IReaderSemaphore`.

These methods allowed bypassing ownership checks to release locks for emergency or administrative cleanup, but they were redundant with the existing ownership-based release methods and have been removed along with their implementations in `KyselySharedLockAdapter`, `MemorySharedLockAdapter`, `MongodbSharedLockAdapter`, `NoOpSharedLockAdapter`, `RedisSharedLockAdapter`, the derived `SharedLock`, and the `withSharedLockPrefix` plugin.

### Migration

- To release a writer lock, use the ownership-based `releaseWriter` or `releaseWriterOrFail` once the owner is available.
- To clean up reader slots, release each slot individually with `releaseReader` or `releaseReaderOrFail`.

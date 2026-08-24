---
"eridu-tech": patch
---

Fix a concurrency bug in `KyselySharedLockAdapter` where `getState` and `removeAllExpired` executed multiple database operations concurrently with `Promise.all`.

Because `Promise.all` runs queries non-atomically, a partial failure or race condition could leave the shared-lock tables in an inconsistent state. These methods now run their internal operations sequentially inside a single database transaction, guaranteeing atomicity and data consistency.

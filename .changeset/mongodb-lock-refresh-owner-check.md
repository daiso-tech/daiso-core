---
"eridu-tech": patch
---

Fixed a bug in `MongodbLockAdapter.refresh` and `MongodbSharedLockAdapter.refreshWriter` where a caller that doesn't own the lock could still modify its expiration.

Previously, both methods only filtered the MongoDB document by `key` and checked ownership *after* the update was applied. As a result, calling `refresh` (or `refreshWriter`) with a stale or foreign `lockId`, or after the lock had already expired, would still mutate the stored expiration even though the method ultimately returned `false`.

The owner and unexpired-expiration checks are now part of the MongoDB query filter itself, making the refresh conditional and atomic:

- `MongodbLockAdapter.refresh` only updates documents matching `key`, `owner: lockId`, and an unexpired `expiration`.
- `MongodbSharedLockAdapter.refreshWriter` only updates documents matching `key`, `writer.owner: lockId`, and an unexpired `writer.expiration`.

A refresh by a non-owner (or of an expired lock) now leaves the document untouched and returns `false` as expected.
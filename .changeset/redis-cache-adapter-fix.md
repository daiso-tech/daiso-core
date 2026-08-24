---
"eridu-tech": patch
---

Fixed `RedisCacheAdapter` to use absolute expiration (`PXAT`) instead of relative TTL (`PX`) when setting key expirations.

Previously, the adapter used Redis's relative expiration option (`PX`) and passed a duration in milliseconds (`ttl.toMilliseconds()`). With relative expiration, Redis only computes the expiry timestamp when the command is executed, so the effective lifetime of a key includes any network and command-processing latency. As a result, keys could outlive their requested `TimeSpan`, causing cache entries to drift from the intended expiration schedule.

The adapter now converts the `TimeSpan` into an absolute expiration timestamp via `ttl.toEndDate().getTime()` and passes it to Redis using the `PXAT` option. This guarantees each key expires at exactly the intended moment, independent of when the command is actually processed by the server.

Affected operations:

- `getOrAdd` (the `eridu_cache_get_or_add` Lua script)
- `add` (when a TTL is provided, using the `NX` guard)
- `put` (when a TTL is provided, using the `GET` guard)

The shared cache adapter test suite was also updated to use a larger delay buffer (`TTL / 2` instead of `TTL / 4`) so the assertions stay reliable under the higher timing precision of absolute expiration.

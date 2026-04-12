---
"@daiso-tech/core": patch
---

# Summary

Introduced the `retryInterval` middleware and streamlined the concurrency API by removing legacy blocking methods.

## Breaking Changes

Removed several "blocking" methods across the locking and semaphore contracts. These methods are now redundant, as their behavior can be more flexibly achieved using the new `retryInterval` middleware.

**Affected Methods:**

- `ILock`: `acquireBlocking`, `acquireBlockingOrFail`, `runBlockingOrFail`
- `ISemaphore`: `acquireBlocking`, `acquireBlockingOrFail`, `runBlockingOrFail`
- `ISharedLock`:
    - Writer: `acquireWriterBlocking`, `acquireWriterBlockingOrFail`, `runWriterBlockingOrFail`
    - Reader: `acquireReaderBlocking`, `acquireReaderBlockingOrFail`, `runReaderBlockingOrFail`

## New Features

- **`retryInterval` Middleware**: A new utility that retries a function call at a specified interval until a defined timeout is reached. This provides a unified way to handle retries across the framework without needing specialized "blocking" variants of every method.

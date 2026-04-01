---
"@daiso-tech/core": minor
---

### Breaking Changes
Async method return types updated from custom `ITask<T>` wrapper to standard `Promise<T>` across `cache`, `circuit-breaker`, `event-bus`, `file-storage`, `lock`, `rate-limiter`, `semaphore`, `shared-lock`, and collection modules. All public APIs now return native JavaScript Promises, requiring updates to code that relied on the previous abstraction.

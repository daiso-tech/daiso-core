---
"@daiso-tech/core": minor
---

#### Breaking Changes

The `Task` class and `ITask` contract have been removed completly. Now native `Promise` is used accross following components:

- cache
- collection
- event-bus
- file-storage
- rate-limiter
- circuit-breaker
- lock
- semaphore
- shared-lock

#### New Features

- Added a reusable delay utility

- The following classes support `waitUntil` configuration, facilitating seamless integration with serverless environments like `Vercel`, `Cloudflare`, and `Netlify`:
    - `Cache`
    - `LockFactory`
    - `SemaphoreFactory`
    - `SharedLockFactory`
    - `CircuitBreakerFactory`
    - `RateLimiterFactory`
    - `FileStorage`
    - `EventBus`


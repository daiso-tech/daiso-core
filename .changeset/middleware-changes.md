---
"@daiso-tech/core": minor
---

### Middleware Component Overhaul

- **Decoupled middleware from execution-context**: The middleware component no longer depends on the `execution-context` component. The `Use` type and `useFactory` implementation have been refactored to remove the `IExecutionContext` dependency — middleware can now receive context via other mechanisms.

- **Added `WithPlugin` contract and `withPluginFactory`**: Introduced the `WithPlugin` type and `withPluginFactory(enhance)` implementation, which applies one or more plugins (function or object-based) to an object instance, each receiving the instance and an `Enhance` function.

### Resilience Middleware Renaming

All resilience component middleware factories have been renamed from `{name}-middleware-factory` to `with-{name}-factory` for a more consistent and descriptive naming convention:

- **Cache**: `cacheMiddlewareFactory` → `withCacheFactory`
- **Circuit Breaker**: `circuitBreakerMiddlewareFactory` → `withCircuitBreakerFactory`
- **Lock**: `lockMiddlewareFactory` → `withLockFactory`
- **Rate Limiter**: `rateLimiterMiddlewareFactory` → `withRateLimiterFactory` (detected as rename)
- **Semaphore**: `semaphoreMiddlewareFactory` → `withSemaphoreFactory`
- **Shared Lock**: `sharedLockMiddlewareFactory` → `withSharedLockFactory`

### Context Dependency Updates

All resilience components now depend on `IReadableContext` instead of `IExecutionContext`:

- Cache
- Circuit Breaker
- Event Bus
- File Storage
- Lock
- Rate Limiter
- Semaphore
- Shared Lock

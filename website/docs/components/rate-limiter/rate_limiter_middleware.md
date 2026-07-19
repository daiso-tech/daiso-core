---
sidebar_position: 7
sidebar_label: Middleware
pagination_label: RateLimiter middleware
tags:
    - RateLimiter
    - Middlewares
    - AOP
keywords:
    - RateLimiter
    - Middlewares
    - AOP
---

# RateLimiter middleware

The RateLimiter middleware wraps function calls with a rate limiter, controlling how many times a function can be invoked within a configured policy window. Each unique key (derived from the function's arguments) gets its own rate limit counter. Once the limit is reached, further invocations are blocked until the policy permits attempts again.

This is useful for preventing abuse, controlling API rate limits, or throttling expensive operations.

## Usage

```ts
import { withRateLimiterFactory } from "@daiso-tech/core/rate-limiter/middlewares";
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";

const rateLimiterFactory = new RateLimiterFactory({
       adapter: new DatabaseRateLimiterAdapter({
        adapter: new MemoryRateLimiterStorageAdapter(),
    }),
});
const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

const fetchHandler = async (request: Request): Promise<Response> => {
    // ...
};

// Wrap with rate limiter — max 10 calls per window
const rateLimitedCall = use(
    fetchHandler,
    withRateLimiter({
        key: (req) => `api:${String(req.headers.get("x-ip"))}`,
        limit: 10,
    }),
);

await rateLimitedCall("users");
```

:::info
Here is a complete list of settings for the [`withRateLimiter`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.WithRateLimiterSettings.html) function.
:::

## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.

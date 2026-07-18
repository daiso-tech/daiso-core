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

## Initial setup

```ts
import { withRateLimiterFactory } from "@daiso-tech/core/rate-limiter/middlewares";
import { RateLimiterFactory } from "@daiso-tech/core/rate-limiter";
import { useFactory } from "@daiso-tech/core/middleware";

const rateLimiterFactory = RateLimiterFactory({
    // Configure adapter (e.g. Redis)
});

const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

const use = useFactory();
```

:::info
Here is a complete list of settings for the [`WithRateLimiter`](https://daiso-tech.github.io/daiso-core/types/RateLimiter.WithRateLimiterSettings.html) function.
:::

## Usage

```ts
const callExternalApi = async (endpoint: string): Promise<unknown> => {
    const response = await fetch(`https://api.example.com/${endpoint}`);
    return response.json();
};

// Wrap with rate limiter — max 10 calls per window
const rateLimitedCall = use(
    callExternalApi,
    withRateLimiter({
        key: (endpoint) => `api:${endpoint}`,
        limit: 10,
    }),
);

await rateLimitedCall("users");
```

## Further information

For further information refer to [`@daiso-tech/core/rate-limiter`](https://daiso-tech.github.io/daiso-core/modules/RateLimiter.html) API docs.

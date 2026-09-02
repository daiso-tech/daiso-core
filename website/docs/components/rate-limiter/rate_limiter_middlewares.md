---
sidebar_position: 7
sidebar_label: Middlewares
pagination_label: RateLimiter middlewares
tags:
    - RateLimiter
    - Middlewares
    - AOP
keywords:
    - RateLimiter
    - Middlewares
    - AOP
---

# RateLimiter middlewares

## withRateLimiterFactory middleware

The RateLimiter middleware wraps function calls with a rate limiter, controlling how many times a function can be invoked within a configured policy window. Each unique key (derived from the function's arguments) gets its own rate limit counter. Once the limit is reached, further invocations are blocked until the policy permits attempts again.

### Usage

```ts
import { withRateLimiterFactory } from "eridu-tech/rate-limiter/middlewares";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";

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

await rateLimitedCall(
    new Request("/url", {
        method: "POST",
    }),
);
```

:::info
Here is a complete list of settings for the [`withRateLimiter`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.WithRateLimiterSettings.html) function.
:::

### Settings

| Option        | Type                             | Description                                                                                                                          |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `key`         | `Invocable<TParameters, string>` | A function that produces the rate-limiter key from the wrapped function's arguments. Each unique key gets its own rate-limit counter |
| `limit`       | `number`                         | Maximum number of invocations allowed within the configured window                                                                   |
| `onlyError`   | `boolean`                        | When `true`, only failed (errored) invocations count toward the rate limit. Defaults to `false`                                      |
| `errorPolicy` | `ErrorPolicy`                    | Determines which errors count toward the rate limit. Defaults to treating all errors as failures                                     |

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.

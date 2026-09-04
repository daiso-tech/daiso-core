import { SlidingWindowLimiter } from "eridu-tech/rate-limiter/policies";
import { constantBackoff } from "eridu-tech/backoff-policies";

await rateLimiterFactoryResolver
    .setBackoffPolicy(constantBackoff())
    .setRateLimiterPolicy(new SlidingWindowLimiter())
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });

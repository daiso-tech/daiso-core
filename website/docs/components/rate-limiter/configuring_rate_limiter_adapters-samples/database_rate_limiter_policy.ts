import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { SlidingWindowLimiter } from "eridu-tech/rate-limiter/policies";

const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
    adapter: rateLimiterStorageAdapter,
    rateLimiterPolicy: new SlidingWindowLimiter(),
});

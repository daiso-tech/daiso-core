import { POLICIES } from "eridu-tech/rate-limiter/policies";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
    rateLimiterPolicy: {
        type: POLICIES.SLIDING_WINDOW,
        failureThreshold: 5,
        successThreshold: 5,
    },
});

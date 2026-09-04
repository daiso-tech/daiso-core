import { BACKOFFS } from "eridu-tech/backoff-policies";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
    backoffPolicy: {
        type: BACKOFFS.CONSTANT,
        delay: TimeSpan.fromSeconds(1),
        jitter: 0.5,
    },
});

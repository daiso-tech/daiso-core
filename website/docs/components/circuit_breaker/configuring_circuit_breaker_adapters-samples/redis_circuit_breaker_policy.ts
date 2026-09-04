import { POLICIES } from "eridu-tech/circuit-breaker/policies";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database,
    circuitBreakerPolicy: {
        type: POLICIES.CONSECUTIVE,
        failureThreshold: 5,
        successThreshold: 5,
    },
});

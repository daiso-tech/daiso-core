import { CIRCUIT_BREAKER_TRIGGER } from "eridu-tech/circuit-breaker/contracts";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
});

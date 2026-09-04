import { CIRCUIT_BREAKER_TRIGGER } from "eridu-tech/circuit-breaker/contracts";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
});

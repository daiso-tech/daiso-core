import { TimeSpan } from "eridu-tech/time-span";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: TimeSpan.fromSeconds(1),
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
});

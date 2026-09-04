import { CountBreaker } from "eridu-tech/circuit-breaker/policies";
import { constantBackoff } from "eridu-tech/backoff-policies";

await circuitBreakerFactoryResolver
    .setBackoffPolicy(constantBackoff())
    .setDefaultCircuitBreakerPolicy(new CountBreaker())
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });

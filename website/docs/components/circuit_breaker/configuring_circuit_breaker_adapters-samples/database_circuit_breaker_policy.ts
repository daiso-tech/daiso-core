import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { SamplingBreaker } from "eridu-tech/circuit-breaker/policies";

const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
    adapter: circuitBreakerStorageAdapter,
    circuitBreakerPolicy: new SamplingBreaker(),
});

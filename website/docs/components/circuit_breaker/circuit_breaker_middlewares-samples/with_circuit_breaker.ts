import { withCircuitBreakerFactory } from "eridu-tech/circuit-breaker/middlewares";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";

const circuitBreakerFactory = new CircuitBreakerFactory({
    adapter: new DatabaseCircuitBreakerAdapter({
        adapter: new MemoryCircuitBreakerStorageAdapter(),
    }),
});
const withCircuitBreaker = withCircuitBreakerFactory(circuitBreakerFactory);

const callExternalApi = async (endpoint: string): Promise<unknown> => {
    const response = await fetch(`https://api.example.com/${endpoint}`);
    return response.json();
};

// Wrap with circuit-breaker
const protectedCall = use(
    callExternalApi,
    withCircuitBreaker({
        key: (endpoint) => `api:${endpoint}`,
    }),
);

await protectedCall("users"); // Succeeds or opens the circuit on repeated failures

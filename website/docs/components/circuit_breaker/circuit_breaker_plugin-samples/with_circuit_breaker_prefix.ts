import { withPlugin } from "eridu-tech/middleware";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { withCircuitBreakerPrefix } from "eridu-tech/circuit-breaker/plugins";

const adapter = new DatabaseCircuitBreakerAdapter({
    adapter: new MemoryCircuitBreakerStorageAdapter(),
});

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(
    adapter,
    withCircuitBreakerPrefix("service-a:"),
);

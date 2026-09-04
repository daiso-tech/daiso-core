import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";

const map = new Map<any, any>();
const memoryCircuitBreakerStorageAdapter =
    new MemoryCircuitBreakerStorageAdapter(map);

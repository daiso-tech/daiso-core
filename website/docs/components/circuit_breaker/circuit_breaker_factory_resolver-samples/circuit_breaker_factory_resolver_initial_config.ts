import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storate-adapter";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
    serde,
    adapters: {
        memory: new DatabaseCircuitBreakerAdapter({
            adapter: new MemoryCircuitBreakerStorageAdapter(),
        }),
        redis: new RedisCircuitBreakerAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION"),
        }),
    },
    defaultAdapter: "memory",
});

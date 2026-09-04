import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const circuitBreakerFactory = new CircuitBreakerFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisCircuitBreakerAdapter({ database: redisClient }),
});

const circuitBreaker = circuitBreakerFactory.create("resource");
const serializedCircuitBreaker = serde.serialize(circuitBreaker);
const deserializedCircuitBreaker = serde.deserialize(circuitBreaker);

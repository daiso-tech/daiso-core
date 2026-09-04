import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import type { ICircuitBreaker } from "eridu-tech/circuit-breaker/contracts";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-circuit-breaker-over-network": {
        circuitBreaker: ICircuitBreaker;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const circuitBreakerFactory = new CircuitBreakerFactory({
    serde,
    adapter: new RedisCircuitBreakerAdapter({ databsae: redis }),
});
const circuitBreaker = circuitBreakerFactory.create("resource");

// We are sending the circuitBreaker over the network to other servers.
await eventBus.dispatch("sending-circuit-breaker-over-network", {
    circuitBreaker,
});

// The other servers will recieve the serialized circuitBreaker and automattically deserialize it.
await eventBus.addListener(
    "sending-circuit-breaker-over-network",
    ({ circuitBreaker }) => {
        // The circuitBreaker is deserialized and can be used
        console.log("CIRCUIT_BREAKER:", circuitBreaker);
    },
);

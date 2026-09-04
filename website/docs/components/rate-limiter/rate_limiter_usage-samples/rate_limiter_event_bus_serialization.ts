import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import type { IRateLimiter } from "eridu-tech/rate-limiter/contracts";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-rate-limiter-over-network": {
        rateLimiter: IRateLimiter;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const rateLimiterFactory = new RateLimiterFactory({
    serde,
    adapter: new RedisRateLimiterAdapter({ databsae: redis }),
});
const rateLimiter = rateLimiterFactory.create("resource");

// We are sending the rateLimiter over the network to other servers.
await eventBus.dispatch("sending-rate-limiter-over-network", {
    rateLimiter,
});

// The other servers will recieve the serialized rateLimiter and automattically deserialize it.
await eventBus.addListener(
    "sending-rate-limiter-over-network",
    ({ rateLimiter }) => {
        // The rateLimiter is deserialized and can be used
        console.log("RATE_LIMITER:", rateLimiter);
    },
);

import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import type { ISemaphore } from "eridu-tech/semaphore/contracts";
import { SemaphoreFactory } from "eridu-tech/semaphore";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-semaphore-over-network": {
        semaphore: ISemaphore;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const semaphoreFactory = new SemaphoreFactory({
    serde,
    adapter: new RedisSemaphoreAdapter(redis),
});
const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
});

// We are sending the semaphore over the network to other servers.
await eventBus.dispatch("sending-semaphore-over-network", {
    semaphore,
});

// The other servers will recieve the serialized semaphore and automattically deserialize it.
await eventBus.addListener(
    "sending-semaphore-over-network",
    ({ semaphore }) => {
        // The semaphore is deserialized and can be used
        console.log("SEMAPHORE:", semaphore);
    },
);

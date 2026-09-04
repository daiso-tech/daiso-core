import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import type { ISharedLock } from "eridu-tech/shared-lock/contracts";
import { SharedLockFactory } from "eridu-tech/shared-lock";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-shared-lock-over-network": {
        sharedLock: ISharedLock;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const sharedLockFactory = new SharedLockFactory({
    serde,
    adapter: new RedisSharedLockAdapter(redis),
});
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

// We are sending the shared-lock over the network to other servers.
await eventBus.dispatch("sending-shared-lock-over-network", {
    sharedLock,
});

// The other servers will recieve the serialized shared-lock and automattically deserialize it.
await eventBus.addListener(
    "sending-shared-lock-over-network",
    ({ sharedLock }) => {
        // The shared-lock is deserialized and can be used
        console.log("SHARED_LOCK:", sharedLock);
    },
);

import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import type { ILock } from "eridu-tech/lock/contracts";
import { LockFactory } from "eridu-tech/lock";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

const serde = new Serde(new SuperJsonSerdeAdapter());
const redis = new Redis("YOUR_REDIS_CONNECTION");

type EventMap = {
    "sending-lock-over-network": {
        lock: ILock;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisPubSubEventBusAdapter({
        client: redis,
        serde,
    }),
});

const lockFactory = new LockFactory({
    serde,
    adapter: new RedisLockAdapter(redis),
});
const lock = lockFactory.create("resource");

// We are sending the lock over the network to other servers.
await eventBus.dispatch("sending-lock-over-network", {
    lock,
});

// The other servers will recieve the serialized lock and automattically deserialize it.
await eventBus.addListener("sending-lock-over-network", ({ lock }) => {
    // The lock is deserialized and can be used
    console.log("LOCK:", lock);
});

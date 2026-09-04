import {
    type IEventBusAdapter,
    BaseEvent,
} from "eridu-tech/event-bus/contracts";
import { EventBusResolver } from "eridu-tech/event-bus";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Redis from "ioredis";

const serde = new Serde(new SuperJsonSerdeAdapter());
const eventBusResolver = new EventBusResolver({
    adapters: {
        memory: new MemoryEventBusAdapter(),
        redis: new RedisPubSubEventBusAdapter({
            client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
            serde,
        }),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});

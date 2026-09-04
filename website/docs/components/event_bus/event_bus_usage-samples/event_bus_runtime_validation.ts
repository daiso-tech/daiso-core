import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { z } from "zod";

type UserCreatedEvent = {
    userId: string;
    name: string;
};
type EventMap = {
    "user.created": UserCreatedEvent;
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
    eventMapSchema: {
        "user.created": z.object({
            userId: z.string(),
            name: z.string(),
        }),
    },
});

await eventBus.dispatch("user.created", {
    userId: "123",
    name: "John",
});

// Throws a ValidationError because userId is missing
await eventBus.dispatch("user.created", {
    name: "Jane",
});

import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import type { IEventBus } from "eridu-tech/event-bus/contracts";
import { EventBus } from "eridu-tech/event-bus";

type AddEvent = {
    a: number;
    b: number;
};

type EventMap = {
    add: AddEvent;
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});

// A typescript error will show up because the event name doesnt exist.
await eventBus.dispatch("addd", {
    a: 2,
    b: 2,
});

// A typescript error will show up because the event fields doesnt match
await eventBus.dispatch("add", {
    nbr1: 1,
    nbr2: 2,
});

// A typescript error will show up because the event name doesnt exist.
await eventBus.addListener("addd", (event) => {
    console.log(event);
});

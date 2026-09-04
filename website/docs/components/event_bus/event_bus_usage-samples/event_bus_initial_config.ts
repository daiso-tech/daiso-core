import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import type { IEventBus } from "eridu-tech/event-bus/contracts";
import { EventBus } from "eridu-tech/event-bus";

const eventBus: IEventBus = new EventBus({
    // You can choose the adapter to use
    adapter: new MemoryEventBusAdapter(),
});

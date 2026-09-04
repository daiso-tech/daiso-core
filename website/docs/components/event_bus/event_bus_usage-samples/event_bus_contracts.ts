import type {
    IEventBus,
    IEventListenable,
    IEventDispatcher,
} from "eridu-tech/event-bus/contracts";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";

type AddEvent = {
    a: number;
    b: number;
};
type EventMap = {
    add: AddEvent;
};

async function listenerFunc(
    eventListenable: IEventListenable<EventMap>,
): Promise<void> {
    // You cannot access the dispatch method
    // You will get typescript error if you try

    await eventListenable.addListener("add", (event) => {
        console.log("EVENT:", event);
    });
}

async function dispatchingFunc(
    eventDispatcher: IEventDispatcher<EventMap>,
): Promise<void> {
    // You cannot access the listener methods
    // You will get typescript error if you try

    await eventDispatcher.dispatch("add", {
        a: 20,
        b: 5,
    });
}

const eventBus: IEventBus<any> = new EventBus({
    // You can choose the adapter to use
    adapter: new MemoryEventBusAdapter(),
});

await listenerFunc(eventBus);
await dispatchingFunc(eventBus);

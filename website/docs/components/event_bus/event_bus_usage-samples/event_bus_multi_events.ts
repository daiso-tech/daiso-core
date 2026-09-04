type AddEvent = {
    a: number;
    b: number;
};
type RemoveEvent = {
    id: number;
};
type EventMap = {
    add: AddEvent;
    remove: RemoveEvent;
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});

// The same listener handles both "add" and "remove" events
await eventBus.addListener(["add", "remove"], (event) => {
    console.log("EVENT:", event);
    // event.type will be "add" or "remove" depending on which was dispatched
});

await eventBus.dispatch("add", { a: 1, b: 2 });
await eventBus.dispatch("remove", { id: 42 });

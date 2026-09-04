import type { BaseEvent } from "eridu-tech/event-bus/contracts";

const listener = (event: BaseEvent) => {
    console.log(event);
};

await eventBus.listenOnce("add", listener);

await eventBus.removeListener("add", listener);

// The listener is removed before dispatch and won't be triggered.
await eventBus.dispatch("add", {
    a: 5,
    b: 5,
});

import { delay } from "eridu-tech/utilities";
import { TimeSpan } from "eridu-tech/time-span";

// Register the promise before dispatching the event.
const eventPromise = eventBus.asPromise("add");

await delay(TimeSpan.fromSeconds(1));
await eventBus.dispatch("add", {
    a: 30,
    b: 20,
});

const event = await eventPromise;

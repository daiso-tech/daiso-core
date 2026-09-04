import { withPlugin } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withListenerTracking } from "eridu-tech/event-bus/plugins";

const adapter = new MemoryEventBusAdapter();

// A plugin that wraps listeners, e.g. to add logging or validation
const loggingPlugin = (instance, enhance) => {
    enhance(
        instance,
        "addListener",
        ({ args: [eventName, listener], next }) => {
            return next([
                eventName,
                (event) => {
                    console.log(`Received "${eventName}"`);
                    return listener(event);
                },
            ]);
        },
    );
};

// Apply listener tracking around a plugin that wraps listeners
const enhancedAdapter = withPlugin(
    adapter,
    withListenerTracking(loggingPlugin),
);

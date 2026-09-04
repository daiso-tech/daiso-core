import { withDispatchBeforeFactory } from "eridu-tech/event-bus/middlewares";
import { EventBus } from "eridu-tech/event-bus";
import { use } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";

type EventMap = {
    "user.before.create": { userId: string };
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});
const withDispatchBefore = withDispatchBeforeFactory(eventBus);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with a "before" dispatch
const wrappedCreateUser = use(
    createUser,
    withDispatchBefore({
        type: "user.before.create",
        payload: ({ args }) => ({ userId: args[0] }),
    }),
);

await wrappedCreateUser("123");
// The "user.before.create" event is dispatched before createUser runs

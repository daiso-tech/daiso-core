import { withDispatchAfterFactory } from "eridu-tech/event-bus/middlewares";
import { EventBus } from "eridu-tech/event-bus";
import { use } from "eridu-tech/middleware";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";

type EventMap = {
    "user.after.create": { userId: string; name: string };
};

const eventBus = new EventBus<EventMap>({
    adapter: new MemoryEventBusAdapter(),
});
const withDispatchAfter = withDispatchAfterFactory(eventBus);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with an "after" dispatch
const wrappedCreateUser = use(
    createUser,
    withDispatchAfter({
        type: "user.after.create",
        payload: ({ args, returnValue }) => ({
            userId: args[0],
            name: returnValue,
        }),
    }),
);

const name = await wrappedCreateUser("123");
// The "user.after.create" event is dispatched after createUser resolves,
// with the return value included in the payload

import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./container";
import { REQUEST_ID } from "./request_id";
import { RequestHandler } from "./request_handler";

// Declare the token as dynamic — its value is only known per request
container.registerDynamic(REQUEST_ID);

// A scoped service can use the dynamic value as a dependency
container.registerFactory({
    token: RequestHandler,
    deps: { requestId: REQUEST_ID },
    factory: ({ requestId }) => new RequestHandler(requestId),
    lifetime: LIFETIME.SCOPED,
});

await container.init();

await container.run({
    registration: async (register) => {
        // Set the dynamic value before the scope executes
        register.set({
            token: REQUEST_ID,
            value: crypto.randomUUID(),
        });
    },
    scope: async () => {
        // The scoped service is injected with the per-request dynamic value
        const handler = await container.resolveOrFail(RequestHandler);
        await handler.handle();
    },
});

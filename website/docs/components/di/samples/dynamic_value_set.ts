import { container } from "./initial_configuration";
import { REQUEST_ID } from "./request_id";

await container.init();

await container.run({
    registration: async (register) => {
        // Set the dynamic value before the scope executes
        await register.set({
            token: REQUEST_ID,
            value: crypto.randomUUID(),
        });
    },
    scope: async () => {
        const requestId = await container.resolve(REQUEST_ID);
        console.log(`Handling request: ${requestId}`);
    },
});

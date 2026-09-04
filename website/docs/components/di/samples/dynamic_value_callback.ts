import { container } from "./initial_configuration";
import { REQUEST_ID } from "./request_id";

await container.init();

await container.run({
    registration: async (register) => {
        await register.set({
            token: REQUEST_ID,
            value: {
                dynamicValue: (executionContext) => {
                    // Compute the value using the execution context
                    return (
                        executionContext.get("correlationId") ??
                        crypto.randomUUID()
                    );
                },
            },
        });
    },
    scope: async () => {
        const requestId = await container.resolveOrFail(REQUEST_ID);
        console.log(`Handling request: ${requestId}`);
    },
});

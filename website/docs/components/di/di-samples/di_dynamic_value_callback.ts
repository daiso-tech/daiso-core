await container.init();

await container.run({
    dynamicRegistration: async (register) => {
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

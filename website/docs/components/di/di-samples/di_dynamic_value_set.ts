await container.init();

await container.run({
    dynamicRegistration: async (register) => {
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

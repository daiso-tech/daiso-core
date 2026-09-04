// Will apply rate-limiter logic using the sqlite adapter
await rateLimiterFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });

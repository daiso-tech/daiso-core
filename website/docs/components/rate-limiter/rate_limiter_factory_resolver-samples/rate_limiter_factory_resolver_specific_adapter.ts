// Will apply rate-limiter logic using the redis adapter
await rateLimiterFactoryResolver
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });

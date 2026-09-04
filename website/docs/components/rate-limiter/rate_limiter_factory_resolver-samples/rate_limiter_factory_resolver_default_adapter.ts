// Will apply rate-limiter logic the default adapter which is MemoryRateLimiterStorageAdapter
await rateLimiterFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });

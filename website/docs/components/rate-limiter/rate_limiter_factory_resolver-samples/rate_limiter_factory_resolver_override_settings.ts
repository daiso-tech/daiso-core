await rateLimiterFactoryResolver
    .setNamespace(new Namespace(["@", "test"]))
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });

await circuitBreakerFactoryResolver
    .use("redis")
    .setNamespace(new Namespace(["@", "test"]))
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });

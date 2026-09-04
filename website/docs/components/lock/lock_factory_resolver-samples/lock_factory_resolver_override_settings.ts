await lockFactoryResolver
    .setDefaultTtl(TimeSpan.fromMinutes(5))
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });

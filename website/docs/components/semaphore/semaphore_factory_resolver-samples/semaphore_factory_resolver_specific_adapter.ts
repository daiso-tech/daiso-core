await semaphoreFactoryResolver
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });

await sharedLockFactoryResolver
    .use("redis")
    .create("shared-resource")
    .runWriterOrFail(async () => {
        // code to run
    });

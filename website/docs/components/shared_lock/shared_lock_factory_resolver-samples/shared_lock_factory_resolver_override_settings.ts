await sharedLockFactoryResolver
    .setNamespace(new Namespace("@my-namespace"))
    .use("redis")
    .create("shared-resource")
    .runWriterOrFail(async () => {
        // code to run
    });

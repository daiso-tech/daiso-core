await sharedLockFactoryResolver
    .use()
    .create("shared-resource")
    .runWriterOrFail(async () => {
        // code to run
    });

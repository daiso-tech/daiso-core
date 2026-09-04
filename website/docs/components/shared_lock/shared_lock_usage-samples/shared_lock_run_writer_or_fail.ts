const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.runWriterOrFail(async () => {
    // ... critical section
});

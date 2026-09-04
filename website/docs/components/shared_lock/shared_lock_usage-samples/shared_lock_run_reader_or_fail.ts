const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.runReaderOrFail(async () => {
    // ... critical section
});

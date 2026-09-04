const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

await sharedLock.refreshReaderOrFail();

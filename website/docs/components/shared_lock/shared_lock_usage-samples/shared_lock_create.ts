const sharedLock = sharedLockFactory.create("shared-resource", {
    // You need to define a limit
    limit: 2,
});

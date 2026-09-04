const sharedLock = sharedLockFactory.create("shared-lock", {
    lockId: "my-shared-lock-id",
});

const hasAcquire = await sharedLock.acquireWriter();
if (hasAcquired) {
    console.log("Shared resource");
    await sharedLock.releaseWriter();
}

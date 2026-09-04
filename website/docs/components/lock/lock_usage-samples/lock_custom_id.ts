const lock = lockFactory.create("lock", {
    lockId: "my-lock-id",
});

const hasAcquire = await lock.acquire();
if (hasAcquired) {
    console.log("Shared resource");
    await lock.release();
}

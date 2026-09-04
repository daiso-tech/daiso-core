const semaphore = semaphoreFactory.create("semaphore", {
    slotId: "my-slot-id",
});

const hasAcquire = await semaphore.acquire();
if (hasAcquired) {
    console.log("Shared resource");
    await semaphore.release();
}

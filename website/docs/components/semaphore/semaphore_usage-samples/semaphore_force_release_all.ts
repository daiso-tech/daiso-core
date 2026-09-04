const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
});

await semaphore.forceReleaseAll();

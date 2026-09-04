const semaphore = semaphoreFactory.create("shared-resource", {
    // You need to define a limit
    limit: 2,
});

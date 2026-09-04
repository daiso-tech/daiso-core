// Create a semaphore with no expiration (non-refreshable)
const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
    ttl: null,
});

// A refresh attempt on this semaphore will fail
const hasRefreshed = await semaphore.refresh();

// This will log 'false' because the semaphore cannot be refreshed
console.log(hasRefreshed);

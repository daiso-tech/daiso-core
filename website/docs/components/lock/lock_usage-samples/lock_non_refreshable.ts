// Create a lock with no expiration (non-refreshable)
const lock = lockFactory.create("resource", {
    ttl: null,
});

// A refresh attempt on this lock will fail
const hasRefreshed = await lock.refresh();

// This will log 'false' because the lock cannot be refreshed
console.log(hasRefreshed);

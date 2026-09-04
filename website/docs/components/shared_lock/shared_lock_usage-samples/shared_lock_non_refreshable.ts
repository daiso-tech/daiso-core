// Create a shared-lock with no expiration (non-refreshable)
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
    ttl: null,
});

// A writer refresh attempt on this shared-ock will fail
const hasRefreshedWriter = await sharedLock.refreshWriter();

// This will log 'false' because the sharedLock cannot be refreshed
console.log(hasRefreshedWriter);

// A reader refresh attempt on this shared-ock will fail
const hasRefreshedReader = await sharedLock.refreshReader();

// This will log 'false' because the sharedLock cannot be refreshed
console.log(hasRefreshedReader);

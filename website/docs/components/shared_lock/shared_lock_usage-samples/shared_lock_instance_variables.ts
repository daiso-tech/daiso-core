const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

// Will return the key of the shared-lock which is "resource"
console.log(sharedLock.key);

// Will return the id of the shared-lock
console.log(sharedLock.id);

// Will return the ttl of the shared-lock
console.log(sharedLock.ttl);

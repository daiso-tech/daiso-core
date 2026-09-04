const sharedLock = sharedLockFactory.create("shared-resource", {
    // Default TTL is 5min if not overrided
    // If you set it to null it means shared-lock will not expire and most be released manually.
    ttl: TimeSpan.fromSeconds(30),
    limit: 2,
});

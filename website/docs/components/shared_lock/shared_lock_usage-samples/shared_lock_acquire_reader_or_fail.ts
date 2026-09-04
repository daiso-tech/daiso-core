// 1 slot will be acquired
try {
    console.log("Acquired");
    // This method will throw if the shared-lock limit is reached.
    await sharedLock.acquireReaderOrFail();
    // The critical section
} catch {
    console.log("Unable to acquire");
} finally {
    await sharedLock.releaseReader();
}

// 2 slots will be acquired
try {
    console.log("Acquired");
    // This method will throw if the shared-lock limit is reached.
    await sharedLock.acquireReaderOrFail();
    // The critical section
} catch {
    console.log("Unable to acquire");
} finally {
    await sharedLock.releaseReader();
}

// Will throw because the limit is reached
await sharedLock.acquireReaderOrFail();

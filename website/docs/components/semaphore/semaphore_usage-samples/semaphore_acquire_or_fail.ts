// 1 slot will be acquired
try {
    console.log("Acquired");
    // This method will throw if the semaphore limit is reached.
    await semaphore.acquireOrFail();
    // The critical section
} catch {
    console.log("Unable to acquire");
} finally {
    await semaphore.release();
}

// 2 slots will be acquired
try {
    console.log("Acquired");
    // This method will throw if the semaphore limit is reached.
    await semaphore.acquireOrFail();
    // The critical section
} catch {
    console.log("Unable to acquire");
} finally {
    await semaphore.release();
}

// Will throw because the limit is reached
await semaphore.acquireOrFail();

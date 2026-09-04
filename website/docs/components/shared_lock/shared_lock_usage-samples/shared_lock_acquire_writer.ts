const hasAquired = await sharedLock.acquireWriter();
if (hasAquired) {
    try {
        // The critical section
    } finally {
        await sharedLock.releaseWriter();
    }
}

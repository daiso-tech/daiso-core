try {
    // This method will throw if the shared-lock is not acquired
    await sharedLock.acquireWriterOrFail();
    // The critical section
} finally {
    await sharedLock.releaseWriter();
}

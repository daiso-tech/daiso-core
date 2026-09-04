const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    database,
});

await kyselySemaphoreAdapter.init();

// Remove all expired semaphore keys manually.
await kyselySemaphoreAdapter.removeAllExpired();

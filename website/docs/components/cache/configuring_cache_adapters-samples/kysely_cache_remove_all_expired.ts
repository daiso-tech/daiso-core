const kyselyCacheAdapter = new KyselyCacheAdapter({
    database,
    serde,
});

await kyselyCacheAdapter.init();

// Remove all expired cache keys manually.
await kyselyCacheAdapter.removeAllExpired();

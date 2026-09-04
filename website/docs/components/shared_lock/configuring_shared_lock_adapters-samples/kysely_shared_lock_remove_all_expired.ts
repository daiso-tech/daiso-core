const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    database,
});

await kyselySharedLockAdapter.init();

// Remove all expired shared-lock keys manually.
await kyselySharedLockAdapter.removeAllExpired();

const kyselyLockAdapter = new KyselyLockAdapter({
    database,
});

await kyselyLockAdapter.init();

// Remove all expired lock keys manually.
await kyselyLockAdapter.removeAllExpired();

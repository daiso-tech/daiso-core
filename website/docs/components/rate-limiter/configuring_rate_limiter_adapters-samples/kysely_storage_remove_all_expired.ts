const kyselyRateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
    kysely,
    serde,
});

await kyselyRateLimiterStorageAdapter.init();

// Remove all expired rate-limiter records manually.
await kyselyRateLimiterStorageAdapter.removeAllExpired();

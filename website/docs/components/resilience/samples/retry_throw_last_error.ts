const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        throwLastError: true,
    }),
]);

await fn();

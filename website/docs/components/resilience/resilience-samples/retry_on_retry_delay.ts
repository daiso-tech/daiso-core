const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        onRetryDelay: (data) => console.log(data),
    }),
]);

await fn();

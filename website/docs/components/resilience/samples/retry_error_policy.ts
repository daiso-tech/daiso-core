const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        // Will only retry errors that are not TypeError
        errorPolicy: (error) => !(error instanceof TypeError),
    }),
]);

await fn();

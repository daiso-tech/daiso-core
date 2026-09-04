const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        onExecutionAttempt: (data) => console.log(data),
    }),
]);

await fn();

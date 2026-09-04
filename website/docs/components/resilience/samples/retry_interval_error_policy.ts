const fn = use(unstableFn, [
    retryInterval({
        time: TimeSpan.fromSeconds(10),
        interval: TimeSpan.fromMilliseconds(500),
        // Will only retry errors that are not a TypeError
        errorPolicy: (error) => !(error instanceof TypeError),
    }),
]);

await fn();

const fn = use(unstableFn, [
    retryInterval({
        time: TimeSpan.fromSeconds(10),
        interval: TimeSpan.fromMilliseconds(500),
        onExecutionAttempt: (data) => console.log(data),
    }),
]);

await fn();

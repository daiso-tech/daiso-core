const fn = use(unstableFn, [
    retryInterval({
        time: TimeSpan.fromSeconds(10),
        interval: TimeSpan.fromMilliseconds(500),
        onRetryDelay: (data) => console.log(data),
    }),
]);

await fn();

const fn = use(fetchData, [
    timeout({
        waitTime: TimeSpan.fromSeconds(2),
        onTimeout: (data) => console.log(data),
    }),
]);

await fn();

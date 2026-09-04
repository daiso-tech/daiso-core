const fn = use(unstableFn, [
    fallback({
        fallbackValue: 1,
        onFallback: (fallbackData) => console.log(fallbackData),
    }),
]);

await fn();

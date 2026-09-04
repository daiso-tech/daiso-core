import { TimeSpan } from "eridu-tech/time-span";

const fn = use(unstableFn, [
    retry({
        maxAttempts: 4,
        // By default a exponential policy is used
        backoffPolicy: (attempt: number, _error: unknown) =>
            TimeSpan.fromMilliseconds(attempt * 100),
    }),
]);

await fn();

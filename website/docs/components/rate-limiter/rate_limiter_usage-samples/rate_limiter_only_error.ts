class ErrorA extends Error {}

const rateLimiter = rateLimiterFactory.create("resource", {
    onlyError: true,
});
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
});

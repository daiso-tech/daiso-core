class ErrorA extends Error {}

const rateLimiter = rateLimiterFactory.create("resource", {
    onlyError: true,
    // Error policy will only work "onlyError" is set to true
    errorPolicy: ErrorA,
});
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
});

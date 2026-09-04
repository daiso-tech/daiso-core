const rateLimiter = rateLimiterFactory.create("resource");

// Will return the key of the rate-limiter which is "resource"
console.log(rateLimiter.key);

const circuitBreaker = circuitBreakerFactory.create("resource");

// Will return the key of the circuit-breaker which is "resource"
console.log(circuitBreaker);

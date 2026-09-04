// The function will only be called when the circuit-breaker is in closed state or half open state.
await circuitBreaker.runOrFail(async () => {
    // Call the external service
});

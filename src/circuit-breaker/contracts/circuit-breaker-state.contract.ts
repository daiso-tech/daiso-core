/**
 * @module CircuitBreaker
 */

/**
 * Enumerated states for circuit breaker operation.
 * - CLOSED: Circuit is operating normally, requests pass through
 * - OPEN: Circuit has detected failures, all requests are blocked
 * - HALF_OPEN: Testing if the service has recovered, limited requests allowed
 * - ISOLATED: Manually isolated, all requests are blocked until reset
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export const CIRCUIT_BREAKER_STATE = {
    /**
     * Open state. Requests are blocked while failures are being handled.
     */
    OPEN: "OPEN",

    /**
     * Transitional state. Service is being tested to see if it has recovered.
     */
    HALF_OPEN: "HALF_OPEN",

    /**
     * Closed state (normal operation). Requests are allowed.
     */
    CLOSED: "CLOSED",

    /**
     * Manually isolated state. All requests are blocked regardless of service health.
     */
    ISOLATED: "ISOLATED",
} as const;

/**
 * Union type of all possible circuit breaker states.
 * Represents the current operational state of a circuit breaker instance.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerState =
    (typeof CIRCUIT_BREAKER_STATE)[keyof typeof CIRCUIT_BREAKER_STATE];

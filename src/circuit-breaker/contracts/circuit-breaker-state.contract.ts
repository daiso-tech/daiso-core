/**
 * @module CircuitBreaker
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export const CIRCUIT_BREAKER_STATE = {
    OPEN: "OPEN",
    HALF_OPEN: "HALF_OPEN",
    CLOSED: "CLOSED",
    ISOLATED: "ISOLATED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerState =
    (typeof CIRCUIT_BREAKER_STATE)[keyof typeof CIRCUIT_BREAKER_STATE];

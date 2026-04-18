/**
 * @module CircuitBreaker
 */

import { type CircuitBreakerState } from "@/circuit-breaker/contracts/_module.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type AsyncLazy } from "@/utilities/_module.js";

/**
 * State and metadata methods for a circuit breaker instance.
 * Provides read-only access to circuit breaker state and configuration properties.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerStateMethods = {
    /**
     * Retrieves the current state of the circuit breaker.
     *
     * @returns The current state (CLOSED, OPEN, HALF_OPEN, or ISOLATED)
     */
    getState(): Promise<CircuitBreakerState>;

    /**
     * The unique identifier for this circuit breaker instance.
     * Multiple circuit breaker instances with the same key share the same failure tracking.
     */
    readonly key: IKey;
};

/**
 * Circuit breaker pattern implementation for protecting against cascading failures.
 * Provides methods to execute functions while monitoring for failures and controlling request flow.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreaker = ICircuitBreakerStateMethods & {
    /**
     * Executes an async function if the circuit breaker is in a permissive state (CLOSED or HALF_OPEN).
     * Blocks execution and throws an error when the circuit is OPEN or ISOLATED.
     * Tracks failures and slow calls to determine state transitions.
     *
     * @template TValue - The return type of the async function
     * @param asyncFn - The function to execute under circuit breaker protection
     * @returns The return value of the function
     * @throws {OpenCircuitBreakerError} If the circuit breaker is in OPEN or ISOLATED state
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * Manually transitions the circuit breaker to ISOLATED state.
     * When isolated, all requests are blocked until explicitly reset.
     * Use this to prevent all traffic to a failing downstream service.
     */
    isolate(): Promise<void>;

    /**
     * Resets the circuit breaker to its initial CLOSED state.
     * Clears failure counts and allows normal traffic flow to resume.
     */
    reset(): Promise<void>;
};

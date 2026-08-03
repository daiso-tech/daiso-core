/**
 * @module CircuitBreaker
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type ICircuitBreakerFactory } from "@/circuit-breaker/contracts/circuit-breaker-factory.contract.js";
import { type CircuitBreakerState } from "@/circuit-breaker/contracts/circuit-breaker-state.contract.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";

/**
 * Represents a state transition event in a circuit breaker.
 * Tracks the before and after states during a state update operation.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerStateTransition = {
    /**
     * The previous circuit breaker state before the transition.
     */
    from: CircuitBreakerState;

    /**
     * The new circuit breaker state after the transition.
     */
    to: CircuitBreakerState;
};

/**
 * Technology-agnostic adapter contract for managing circuit breaker instances.
 * Implementations handle state persistence, metric tracking, and state transitions independent of the underlying storage and algorithm.
 * **Note:** This contract is low-level and typically not used directly - prefer {@link ICircuitBreakerFactory | `ICircuitBreakerFactory`} for creating circuit breaker instances.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerAdapter = {
    /**
     * Retrieves the current operational state of a circuit breaker.
     *
     * @param key - Unique identifier for the circuit breaker instance
     * @param context - Readable execution context for the operation
     *
     * @returns Promise resolving to one of: CLOSED (normal operation), OPEN (rejecting calls),
     *          HALF_OPEN (testing recovery), or ISOLATED (manually blocked)
     */
    getState(
        key: string,
        context: IReadableContext,
    ): Promise<CircuitBreakerState>;

    /**
     * Evaluates the circuit breaker's policy and transitions to a new state if necessary.
     * Consults the policy to determine if enough time has passed or metrics have changed to warrant a state change.
     *
     * @param key - Unique identifier for the circuit breaker instance
     * @param context - Readable execution context for the operation
     *
     * @returns Promise resolving to the transition details (from and to states)
     */
    updateState(
        key: string,
        context: IReadableContext,
    ): Promise<CircuitBreakerStateTransition>;

    /**
     * Manually forces the circuit breaker into an ISOLATED state.
     * In isolated state, all calls are rejected regardless of the underlying service status.
     * Must be manually reset to restore normal operation.
     *
     * @param key - Unique identifier for the circuit breaker instance
     * @param context - Readable execution context for the operation
     *
     * @returns Promise that resolves when isolation is applied
     */
    isolate(key: string, context: IReadableContext): Promise<void>;

    /**
     * Records a failure event in the circuit breaker's metrics.
     * Used by the policy to accumulate failure counts and determine if the circuit should open.
     *
     * @param key - Unique identifier for the circuit breaker instance
     * @param context - Readable execution context for the operation
     *
     * @returns Promise that resolves when the failure is recorded
     */
    trackFailure(key: string, context: IReadableContext): Promise<void>;

    /**
     * Records a successful call in the circuit breaker's metrics.
     * Used by the policy to reset failure counts or validate recovery during HALF_OPEN state.
     *
     * @param key - Unique identifier for the circuit breaker instance
     * @param context - Readable execution context for the operation
     *
     * @returns Promise that resolves when the success is recorded
     */
    trackSuccess(key: string, context: IReadableContext): Promise<void>;

    /**
     * Resets the circuit breaker to its initial state, discarding all accumulated metrics and history.
     * Useful for recovery from stuck states or when the underlying service has been repaired.
     *
     * @param key - Unique identifier for the circuit breaker instance
     * @param context - Readable execution context for the operation
     *
     * @returns Promise that resolves when the reset is complete
     */
    reset(key: string, context: IReadableContext): Promise<void>;
};

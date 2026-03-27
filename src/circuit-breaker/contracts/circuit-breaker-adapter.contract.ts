/**
 * @module CircuitBreaker
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type ICircuitBreakerFactory } from "@/circuit-breaker/contracts/circuit-breaker-factory.contract.js";
import { type CircuitBreakerState } from "@/circuit-breaker/contracts/circuit-breaker-state.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerStateTransition = {
    from: CircuitBreakerState;
    to: CircuitBreakerState;
};

/**
 * The `ICircuitBreakerAdapter` contract defines a way for managing circuit breakers independent of the underlying technology and algorithm.
 * This contract is not meant to be used directly, instead you should use {@link ICircuitBreakerFactory | `ICircuitBreakerFactory`} contract.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerAdapter = {
    /**
     * The `getState` method returns the state of the circuit breaker. The circuit breaker can be closed, open, half open state and isolated state.
     */
    getState(key: string): Promise<CircuitBreakerState>;

    /**
     * The `updateState` method updates the state of the circuit breaker and returns the state transition.
     */
    updateState(key: string): Promise<CircuitBreakerStateTransition>;

    /**
     * The `isolate` method will transition the circuit breaker to isolated state, meaning the circuit breaker will reject all attempts untill it is manually reset.
     */
    isolate(key: string): Promise<void>;

    /**
     * The `trackFailure` will method will track failure metric that will be used in `updateState` method.
     */
    trackFailure(key: string): Promise<void>;

    /**
     * The `trackSuccess` will method will track success metric that will be used in `updateState` method.
     */
    trackSuccess(key: string): Promise<void>;

    /**
     * The `reset` method resets circuit breaker to its initial state regardless of the current state.
     */
    reset(key: string): Promise<void>;
};

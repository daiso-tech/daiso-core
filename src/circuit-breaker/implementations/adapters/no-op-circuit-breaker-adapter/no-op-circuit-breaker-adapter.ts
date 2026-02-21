/**
 * @module CircuitBreaker
 */

import {
    CIRCUIT_BREAKER_STATE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ICircuitBreakerProvider,
    type CircuitBreakerState,
    type CircuitBreakerStateTransition,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";

/**
 * This `NoOpCircuitBreakerAdapter` will do nothing and is used for easily mocking {@link ICircuitBreakerProvider | `ICircuitBreakerProvider`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/no-op-circuit-breaker-adapter"`
 * @group Adapters
 */
export class NoOpCircuitBreakerAdapter implements ICircuitBreakerAdapter {
    getState(_key: string): Promise<CircuitBreakerState> {
        return Promise.resolve(CIRCUIT_BREAKER_STATE.CLOSED);
    }

    updateState(_key: string): Promise<CircuitBreakerStateTransition> {
        return Promise.resolve({
            from: CIRCUIT_BREAKER_STATE.CLOSED,
            to: CIRCUIT_BREAKER_STATE.CLOSED,
        } satisfies CircuitBreakerStateTransition);
    }

    isolate(_key: string): Promise<void> {
        return Promise.resolve();
    }

    trackFailure(_key: string): Promise<void> {
        return Promise.resolve();
    }

    trackSuccess(_key: string): Promise<void> {
        return Promise.resolve();
    }

    reset(_key: string): Promise<void> {
        return Promise.resolve();
    }
}

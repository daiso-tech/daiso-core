/**
 * @module CircuitBreaker
 */

import {
    CIRCUIT_BREAKER_STATE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ICircuitBreakerFactory,
    type CircuitBreakerState,
    type CircuitBreakerStateTransition,
    type ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";

/**
 * The `NoOpCircuitBreakerAdapter` will do nothing and is used for easily mocking {@link ICircuitBreakerFactory | `ICircuitBreakerFactory`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/no-op-circuit-breaker-adapter"`
 * @group Adapters
 */
export class NoOpCircuitBreakerAdapter implements ICircuitBreakerAdapter {
    getState(
        _context: IReadableContext,
        _key: string,
    ): Promise<CircuitBreakerState> {
        return Promise.resolve(CIRCUIT_BREAKER_STATE.CLOSED);
    }

    updateState(
        _context: IReadableContext,
        _key: string,
    ): Promise<CircuitBreakerStateTransition> {
        return Promise.resolve({
            from: CIRCUIT_BREAKER_STATE.CLOSED,
            to: CIRCUIT_BREAKER_STATE.CLOSED,
        } satisfies CircuitBreakerStateTransition);
    }

    isolate(_context: IReadableContext, _key: string): Promise<void> {
        return Promise.resolve();
    }

    trackFailure(_context: IReadableContext, _key: string): Promise<void> {
        return Promise.resolve();
    }

    trackSuccess(_context: IReadableContext, _key: string): Promise<void> {
        return Promise.resolve();
    }

    reset(_context: IReadableContext, _key: string): Promise<void> {
        return Promise.resolve();
    }
}

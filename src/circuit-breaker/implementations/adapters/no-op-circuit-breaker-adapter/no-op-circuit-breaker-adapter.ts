/**
 * @module CircuitBreaker
 */

import {
    CIRCUIT_BREAKER_STATE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
} from "@/circuit-breaker/contracts/_module.js";

import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ICircuitBreakerFactory,
    CircuitBreakerState,
    CircuitBreakerStateTransition,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module.js";
import type { IReadableContext } from "@/execution-context/contracts/_module.js";

/**
 * The `NoOpCircuitBreakerAdapter` will do nothing and is used for easily mocking {@link ICircuitBreakerFactory | `ICircuitBreakerFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/no-op-circuit-breaker-adapter"`
 * @group Adapters
 */
export class NoOpCircuitBreakerAdapter implements ICircuitBreakerAdapter {
    getState(
        _key: string,
        _context: IReadableContext,
    ): Promise<CircuitBreakerState> {
        return Promise.resolve(CIRCUIT_BREAKER_STATE.CLOSED);
    }

    updateState(
        _key: string,
        _context: IReadableContext,
    ): Promise<CircuitBreakerStateTransition> {
        return Promise.resolve({
            from: CIRCUIT_BREAKER_STATE.CLOSED,
            to: CIRCUIT_BREAKER_STATE.CLOSED,
        } satisfies CircuitBreakerStateTransition);
    }

    isolate(_key: string, _context: IReadableContext): Promise<void> {
        return Promise.resolve();
    }

    trackFailure(_key: string, _context: IReadableContext): Promise<void> {
        return Promise.resolve();
    }

    trackSuccess(_key: string, _context: IReadableContext): Promise<void> {
        return Promise.resolve();
    }

    reset(_key: string, _context: IReadableContext): Promise<void> {
        return Promise.resolve();
    }
}

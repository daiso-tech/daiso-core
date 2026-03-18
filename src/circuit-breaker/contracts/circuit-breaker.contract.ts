/**
 * @module CircuitBreaker
 */

import {
    type CircuitBreakerState,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type OpenCircuitBreakerError,
} from "@/circuit-breaker/contracts/_module.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type ITask } from "@/task/contracts/_module.js";
import { type AsyncLazy } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerStateMethods = {
    getState(): ITask<CircuitBreakerState>;

    /**
     * The `key` of the `ICircuitBreaker` instance.
     */
    readonly key: IKey;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreaker = ICircuitBreakerStateMethods & {
    /**
     * The `runOrFail` method runs `asyncFn` in when the circuit breaker is in closed state and half opend state.
     * Throws an error when in opend state.
     *
     * @throws {OpenCircuitBreakerError} {@link OpenCircuitBreakerError}
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): ITask<TValue>;

    /**
     * The `isolate` method will transition the circuit breaker to isolated state, meaning the circuit breaker will reject all attempts untill it is manually reset.
     */
    isolate(): ITask<void>;

    /**
     * The `reset` method resets circuit breaker to its initial state regardless of the current state.
     */
    reset(): ITask<void>;
};

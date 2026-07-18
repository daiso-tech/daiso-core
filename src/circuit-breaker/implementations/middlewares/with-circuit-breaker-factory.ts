/**
 * @module CircuitBreaker
 */

import {
    type CircuitBreakerTrigger,
    type ICircuitBreakerFactoryBase,
} from "@/circuit-breaker/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    callInvokable,
    type Invokable,
    type ErrorPolicySettings,
} from "@/utilities/_module.js";

/**
 * Settings for the circuit-breaker middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @group Middleware
 */
export type WithCircuitBreakerSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = ErrorPolicySettings & {
    /**
     * A function or static value that produces a unique identifier for the
     * circuit from the wrapped function's arguments. Each unique key gets its
     * own circuit state.
     *
     * @default
     * ```ts
     * (...args) => JSON.stringify(args)
     * ```
     */
    key: Invokable<TParameters, string>;

    /**
     * Optional custom trigger that determines when the circuit should open.
     * If omitted the default trigger shipped with the circuit-breaker is used.
     */
    trigger?: CircuitBreakerTrigger;

    /**
     * Duration above which a call is considered "slow". When the slow-call
     * threshold is exceeded the call counts toward opening the circuit
     * (if configured in the trigger).
     */
    slowCallTime?: ITimeSpan;
};

/**
 * Creates a middleware factory that wraps function calls with a
 * circuit-breaker.
 *
 * Each unique key (derived from the wrapped function's arguments) gets its
 * own circuit instance. When the circuit is open the wrapped function is not
 * called and an error is thrown instead, preventing cascading failures.
 *
 * @param circuitBreakerFactory - The circuit-breaker factory to use.
 * @returns A function that accepts {@link WithCircuitBreakerSettings} and
 *          returns a middleware.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/middlewares"`
 * @group Middleware
 */
export function withCircuitBreakerFactory(
    circuitBreakerFactory: ICircuitBreakerFactoryBase,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithCircuitBreakerSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key = (...args) => JSON.stringify(args), ...rest } = settings;
        return ({ next, args }) => {
            return circuitBreakerFactory
                .create(callInvokable(key, ...args), rest)
                .runOrFail(next);
        };
    };
}

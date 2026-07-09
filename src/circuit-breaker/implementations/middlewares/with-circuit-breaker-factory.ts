/**
 * @module RateLimiter
 */

import {
    type CircuitBreakerTrigger,
    type ICircuitBreakerFactoryBase,
} from "@/circuit-breaker/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import {
    callInvokable,
    type ErrorPolicy,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export type WithCircuitBreakerSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = ErrorPolicy & {
    key: Invokable<TParameters, string>;
    trigger?: CircuitBreakerTrigger;
    slowCallTime?: ITimeSpan;
};

/**
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

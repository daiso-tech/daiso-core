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
export type CircuitBreakerMiddlewareSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = ErrorPolicy & {
    /**
     * @default
     * ```ts
     * (...args) => JSON.stringify(args)
     * ```
     */
    key?: Invokable<TParameters, string>;
    trigger?: CircuitBreakerTrigger;
    slowCallTime?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/middlewares"`
 * @group Middleware
 */
export function circuitBreakerMiddlewareFactory(
    circuitBreakerFactory: ICircuitBreakerFactoryBase,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: CircuitBreakerMiddlewareSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key = (...args) => JSON.stringify(args), ...rest } = settings;
        return ({ next, args }) => {
            return circuitBreakerFactory
                .create(callInvokable(key, ...args), rest)
                .runOrFail(next);
        };
    };
}

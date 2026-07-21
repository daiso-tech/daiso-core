/**
 * @module RateLimiter
 */

import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type IRateLimiterFactory } from "@/rate-limiter/contracts/_module.js";
import {
    callInvokable,
    type ErrorPolicySettings,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * Settings for the rate-limiter middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @group Middleware
 */
export type WithRateLimiterSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = ErrorPolicySettings & {
    /**
     * A function or static value that produces the rate-limiter key from the
     * wrapped function's arguments. Each unique key gets its own rate-limit
     * counter.
     */
    key: Invokable<TParameters, string>;

    /**
     * When `true`, only failed (errored) invocations count toward the rate
     * limit. Successful calls are ignored.
     *
     * @default false
     */
    onlyError?: boolean;

    /**
     * Maximum number of invocations allowed within the configured window.
     */
    limit: number;
};

/**
 * A higher-order function that creates a middleware factory which wraps
 * function calls with a rate limiter.
 *
 * Each unique key (derived from the wrapped function's arguments) gets its
 * own rate-limit counter. When the maximum number of invocations (`limit`)
 * is exceeded within the configured window subsequent calls throw a
 * rate-limit error instead of executing the wrapped function.
 *
 * @param rateLimiterFactory - The rate-limiter factory to use.
 * @returns A higher-order function that accepts {@link WithRateLimiterSettings}
 *          and returns a {@link MiddlewareFn}.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/middlewares"`
 * @group Middleware
 */
export function withRateLimiterFactory(
    rateLimiterFactory: IRateLimiterFactory,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithRateLimiterSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key = (...args) => JSON.stringify(args), ...rest } = settings;
        return ({ next, args }) => {
            return rateLimiterFactory
                .create(callInvokable(key, ...args), rest)
                .runOrFail(next);
        };
    };
}

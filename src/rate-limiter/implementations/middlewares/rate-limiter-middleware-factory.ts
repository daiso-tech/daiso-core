/**
 * @module RateLimiter
 */

import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type IRateLimiterFactoryBase } from "@/rate-limiter/contracts/_module.js";
import {
    callInvokable,
    type ErrorPolicy,
    type Invokable,
} from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export type RateLimiterMiddlewareSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = ErrorPolicy & {
    /**
     * @default
     * ```ts
     * (...args) => JSON.stringify(args)
     * ```
     */
    key?: Invokable<TParameters, string>;
    onlyError?: boolean;
    limit: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/middlewares"`
 * @group Middleware
 */
export function rateLimiterMiddlewareFactory(
    rateLimiterFactory: IRateLimiterFactoryBase,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: RateLimiterMiddlewareSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key = (...args) => JSON.stringify(args), ...rest } = settings;
        return ({ next, args }) => {
            return rateLimiterFactory
                .create(callInvokable(key, ...args), rest)
                .runOrFail(next);
        };
    };
}

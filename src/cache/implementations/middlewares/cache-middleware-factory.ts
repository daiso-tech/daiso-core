/**
 * @module RateLimiter
 */

import {
    type CacheWriteSettings,
    type ICacheBase,
} from "@/cache/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/types.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export type CacheMiddlewareSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = CacheWriteSettings & {
    /**
     * @default
     * ```ts
     * (...args) => JSON.stringify(args)
     * ```
     */
    key?: Invokable<TParameters, string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/middlewares"`
 * @group Middleware
 */
export function cacheMiddlewareFactory(cache: ICacheBase) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: CacheMiddlewareSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key = (...args) => JSON.stringify(args), ...rest } = settings;
        return async ({ next, args }) => {
            return cache.getOrAdd(
                callInvokable(key, ...args),
                next,
                rest,
            ) as Promise<TReturn>;
        };
    };
}

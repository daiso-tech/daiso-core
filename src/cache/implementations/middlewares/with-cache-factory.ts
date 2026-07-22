/**
 * @module Cache
 */

import { type ICache } from "@/cache/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * Settings for the cache middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @group Middleware
 */
export type WithCacheSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    ttl?: ITimeSpan | null;

    /**
     *  A function that produces the cache key from the
     * wrapped function's arguments.
     */
    key: Invokable<TParameters, string>;
};

/**
 * Creates a middleware factory that caches the return value of the wrapped
 * function using the provided {@link ICache} instance.
 *
 * The cache key is derived from the wrapped function's arguments via the
 * `key` setting. If the key is already present in the cache the cached value
 * is returned immediately; otherwise the wrapped function is invoked and its
 * result is stored before being returned.
 *
 * @param cache - The cache store to use.
 * @returns A function that accepts {@link WithCacheSettings} and returns a
 *          middleware.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/middlewares"`
 * @group Middleware
 */
export function withCacheFactory(cache: Pick<ICache, "getOrAdd">) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithCacheSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key = (...args) => JSON.stringify(args), ttl } = settings;
        return async ({ next, args }) => {
            return cache.getOrAdd(
                callInvokable(key, ...args),
                next,
                ttl,
            ) as Promise<TReturn>;
        };
    };
}

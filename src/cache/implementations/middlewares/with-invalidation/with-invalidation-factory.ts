/**
 * @module Cache
 */

import { callInvocable } from "@/utilities/_module.js";

import type { ICache } from "@/cache/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { Invocable } from "@/utilities/_module.js";

/**
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type WithInvalidationSettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /**
     *  A function that produces the cache key from the
     * wrapped function's arguments.
     */
    key: Invocable<TParameters, string>;

    /**
     * A function that determines whether the cache entry should be
     * invalidated after the wrapped function has been invoked.
     *
     * It receives the wrapped function's arguments and its return value.
     * When it returns `true`, the cache entry identified by `key` is removed.
     *
     * @default
     * ```ts
     * () => true
     * ```
     */
    shouldInvalidate?: Invocable<
        [args: TParameters, returnValue: TReturn],
        boolean
    >;
};

/**
 * Creates a middleware factory that invalidates a cache entry after the
 * wrapped function has been invoked.
 *
 * This is useful for write-invalidation caching patterns, where stale cached
 * data must be cleared after a mutation.
 *
 * @param cache - The cache store whose entries should be invalidated.
 * @returns A function that accepts {@link WithInvalidationSettings} and
 *          returns a middleware.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export function withInvalidationFactory(cache: Pick<ICache, "remove">) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithInvalidationSettings<TParameters, TReturn>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        const { key, shouldInvalidate = () => true } = settings;
        return async ({ next, args }) => {
            const value = await next();
            if (callInvocable(shouldInvalidate, args, value)) {
                await cache.remove(callInvocable(key, ...args));
            }
            return value;
        };
    };
}

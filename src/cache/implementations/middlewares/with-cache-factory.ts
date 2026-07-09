/**
 * @module RateLimiter
 */

import {
    type CacheWriteSettings,
    type ICacheBase,
} from "@/cache/contracts/_module.js";
import { type MiddlewareFn } from "@/middleware/contracts/_module.js";
import { callInvokable, type Invokable } from "@/utilities/_module.js";

/**
 * @group Middleware
 */
export type WithCacheSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = CacheWriteSettings & {
    key: Invokable<TParameters, string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/cache/middlewares"`
 * @group Middleware
 */
export function withCacheFactory(cache: ICacheBase) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithCacheSettings<TParameters>,
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

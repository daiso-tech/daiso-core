/**
 * @module Cache
 */

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { withJitter } from "@/utilities/_module.js";

/**
 * Settings for the {@link withCacheJitter} plugin.
 *
 * @group Plugins
 */
export type WithCacheJitterSettings = {
    /**
     * @default 0.2
     */
    defaultJitter?: number;

    /**
     * @internal
     */
    _mathRandom?: () => number;
};

/**
 * Creates a plugin that adds random jitter to TTL values on cache `add` and
 * `put` operations.
 *
 * Applying jitter to TTLs helps prevent cache stampedes / thundering-herd
 * problems by staggering the expiration times of cache entries that were
 * originally created with the same TTL.
 *
 * @param settings - Configuration for the jitter behaviour.
 * @param settings.defaultJitter - The jitter factor as a ratio of the original
 *                                 TTL (e.g., `0.2` means ±20 %).
 *                                 @default 0.2
 * @returns A middleware plugin that wraps an `ICacheAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/plugins"`
 * @typeParam TType - The type of values stored in the cache.
 * @group Plugins
 */
export function withCacheJitter<TType>(
    settings: WithCacheJitterSettings = {},
): PluginFn<ICacheAdapter<TType>> {
    const { defaultJitter = 0.2, _mathRandom = () => Math.random() } = settings;
    function ttlWithJitter(ttl: TimeSpan | null): TimeSpan | null {
        if (ttl === null) {
            return null;
        }
        return TimeSpan.fromMilliseconds(
            withJitter({
                jitter: defaultJitter,
                randomValue: _mathRandom(),
                value: ttl.toMilliseconds(),
            }),
        );
    }
    return (adapter, enhance) => {
        enhance(
            adapter,
            "add",
            ({ args: [context, key, value, ttl], next }) => {
                return next([context, key, value, ttlWithJitter(ttl)]);
            },
        );
        enhance(
            adapter,
            "put",
            ({ args: [context, key, value, ttl], next }) => {
                return next([context, key, value, ttlWithJitter(ttl)]);
            },
        );
    };
}

/**
 * @module Cache
 */

import { withJitter } from "@/utilities/_module.js";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Settings for the {@link withCacheJitter} plugin.
 *
 * IMPORT_PATH: `"eridu-tech/cache/plugins"`
 * @group Plugins
 */
export type WithCacheJitterSettings = {
    /**
     * The jitter factor as a ratio of the original TTL.
     * For example, `0.2` means the TTL will be randomly adjusted by 20 %.
     * A value of `0` disables jitter entirely.
     *
     * @default 0.2
     */
    defaultJitter?: number;

    /**
     * @internal
     */
    internalMathRandom?: () => number;
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
 *                                 TTL (e.g., `0.2` means 20 %).
 *                                 @default 0.2
 * @returns A middleware plugin that wraps an `ICacheAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/cache/plugins"`
 * @group Plugins
 */
export function withCacheJitter(
    settings: WithCacheJitterSettings = {},
): PluginFn<ICacheAdapter> {
    const { defaultJitter = 0.2, internalMathRandom = () => Math.random() } =
        settings;
    function ttlWithJitter(ttl: Date | null): Date | null {
        if (ttl === null) {
            return null;
        }
        return new Date(
            withJitter({
                jitter: defaultJitter,
                randomValue: internalMathRandom(),
                value: ttl.getTime(),
            }),
        );
    }
    return (adapter, enhance) => {
        enhance(adapter, "add", ({ args: [key, value, ttl], next }) => {
            return next([key, value, ttlWithJitter(ttl)]);
        });
        enhance(adapter, "put", ({ args: [key, value, ttl], next }) => {
            return next([key, value, ttlWithJitter(ttl)]);
        });
        enhance(adapter, "getOrAdd", ({ args: [key, value, ttl], next }) => {
            return next([key, value, ttlWithJitter(ttl)]);
        });
    };
}

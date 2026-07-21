/**
 * @module RateLimiter
 */

import { type PluginFn } from "@/middleware/contracts/_module.js";
import { type IRateLimiterAdapter } from "@/rate-limiter/contracts/_module.js";

/**
 * Creates a plugin that prefixes all keys passed to a rate-limiter adapter.
 *
 * Every method that accepts a rate-limiter key will have the given `prefix`
 * prepended before the call is forwarded to the underlying adapter. This is
 * useful for namespacing rate-limiter state when multiple independent consumers
 * share the same backend.
 *
 * @param prefix - The string to prepend to every rate-limiter key.
 * @returns A middleware plugin that wraps an `IRateLimiterAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/plugins"`
 * @group Plugins
 */
export function withRateLimiterPrefix(
    prefix: string,
): PluginFn<IRateLimiterAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "getState", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "reset", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(
            adapter,
            "updateState",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
    };
}

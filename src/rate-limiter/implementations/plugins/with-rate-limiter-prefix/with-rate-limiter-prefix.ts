/**
 * @module RateLimiter
 */

import { type PluginFn } from "@/middleware/contracts/_module.js";
import { type IRateLimiterAdapter } from "@/rate-limiter/contracts/rate-limiter-adapter.contract.js";

/**
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

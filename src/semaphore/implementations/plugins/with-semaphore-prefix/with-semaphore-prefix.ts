/**
 * @module RateLimiter
 */

import { type PluginFn } from "@/middleware/contracts/_module.js";
import { type ISemaphoreAdapter } from "@/semaphore/contracts/_module.js";

/**
 * @group Plugins
 */
export function withSemaphorePrefix(
    prefix: string,
): PluginFn<ISemaphoreAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(
            adapter,
            "acquire",
            ({ args: [{ context, key, ...rest }], next }) => {
                return next([
                    {
                        context,
                        key: withPrefix(key),
                        ...rest,
                    },
                ]);
            },
        );
        enhance(
            adapter,
            "forceReleaseAll",
            ({ args: [context, key], next }) => {
                return next([context, withPrefix(key)]);
            },
        );
        enhance(adapter, "getState", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(
            adapter,
            "refresh",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "release",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
    };
}

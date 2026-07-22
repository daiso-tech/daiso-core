/**
 * @module Semaphore
 */

import { type PluginFn } from "@/middleware/contracts/_module.js";
import { type ISemaphoreAdapter } from "@/semaphore/contracts/_module.js";

/**
 * Creates a plugin that prefixes all keys passed to a semaphore adapter.
 *
 * Every method that accepts a semaphore key will have the given `prefix`
 * prepended before the call is forwarded to the underlying adapter. This is
 * useful for namespacing semaphore state when multiple independent consumers
 * share the same backend.
 *
 * @param prefix - The string to prepend to every semaphore key.
 * @returns A middleware plugin that wraps an `ISemaphoreAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/plugins"`
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

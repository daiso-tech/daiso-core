/**
 * @module Lock
 */

import { type ILockAdapter } from "@/lock/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that prefixes all keys passed to a lock adapter.
 *
 * Every method that accepts a lock key will have the given `prefix` prepended
 * before the call is forwarded to the underlying adapter. This is useful for
 * namespacing locks when multiple independent consumers share the same lock
 * backend.
 *
 * @param prefix - The string to prepend to every lock key.
 * @returns A middleware plugin that wraps an `ILockAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/plugins"`
 * @group Plugins
 */
export function withLockPrefix(prefix: string): PluginFn<ILockAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(
            adapter,
            "acquire",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "forceRelease", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
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

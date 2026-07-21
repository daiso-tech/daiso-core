/**
 * @module SharedLock
 */

import { type PluginFn } from "@/middleware/contracts/_module.js";
import { type ISharedLockAdapter } from "@/shared-lock/contracts/_module.js";

/**
 * Creates a plugin that prefixes all keys passed to a shared-lock adapter.
 *
 * Every method that accepts a lock key will have the given `prefix` prepended
 * before the call is forwarded to the underlying adapter. This applies to both
 * writer and reader operations, including acquire, release, refresh, and
 * force-release methods.
 *
 * @param prefix - The string to prepend to every shared-lock key.
 * @returns A middleware plugin that wraps an `ISharedLockAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/plugins"`
 * @group Plugins
 */
export function withSharedLockPrefix(
    prefix: string,
): PluginFn<ISharedLockAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "forceRelease", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "getState", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });

        enhance(
            adapter,
            "acquireWriter",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "forceReleaseWriter",
            ({ args: [context, key], next }) => {
                return next([context, withPrefix(key)]);
            },
        );
        enhance(
            adapter,
            "refreshWriter",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "releaseWriter",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );

        enhance(
            adapter,
            "acquireReader",
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
            "forceReleaseAllReaders",
            ({ args: [context, key], next }) => {
                return next([context, withPrefix(key)]);
            },
        );
        enhance(
            adapter,
            "refreshReader",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
    };
}

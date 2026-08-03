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
 * IMPORT_PATH: `"eridu-tech/shared-lock/plugins"`
 * @group Plugins
 */
export function withSharedLockPrefix(
    prefix: string,
): PluginFn<ISharedLockAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "forceRelease", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "getState", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });

        enhance(adapter, "acquireWriter", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "forceReleaseWriter",
            ({ args: [key, ...rest], next }) => {
                return next([withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "refreshWriter", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "releaseWriter", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });

        enhance(
            adapter,
            "acquireReader",
            ({ args: [{ key, ...rest }], next }) => {
                return next([
                    {
                        key: withPrefix(key),
                        ...rest,
                    },
                ]);
            },
        );
        enhance(
            adapter,
            "forceReleaseAllReaders",
            ({ args: [key, ...rest], next }) => {
                return next([withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "refreshReader", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "releaseReader", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
    };
}

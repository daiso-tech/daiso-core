/**
 * @module RateLimiter
 */

import { type PluginFn } from "@/middleware/contracts/_module.js";
import { type ISharedLockAdapter } from "@/shared-lock/contracts/shared-lock-adapter.contract.js";

/**
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

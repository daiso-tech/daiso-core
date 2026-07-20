/**
 * @module Lock
 */

import { type ILockAdapter } from "@/lock/contracts/lock-adapter.contract.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
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

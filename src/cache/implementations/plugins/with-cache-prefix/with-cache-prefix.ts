/**
 * @module Cache
 */

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * @group Plugins
 */
export function withCachePrefix<TType>(
    prefix: string,
): PluginFn<ICacheAdapter<TType>> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "add", ({ args: [context, key, ...rest], next }) => {
            return next([context, withPrefix(key), ...rest]);
        });
        enhance(adapter, "get", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "getAndRemove", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(
            adapter,
            "increment",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "put", ({ args: [context, key, ...rest], next }) => {
            return next([context, withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "removeByKeyPrefix",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "removeMany", ({ args: [context, keys], next }) => {
            return next([context, keys.map(withPrefix)]);
        });
        enhance(
            adapter,
            "update",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
    };
}

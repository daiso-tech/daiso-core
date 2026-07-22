/**
 * @module Cache
 */

import { type ICacheAdapter } from "@/cache/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that prefixes all keys passed to a cache adapter.
 *
 * Every method that accepts a cache key will have the given `prefix` prepended
 * before the call is forwarded to the underlying adapter. This is useful for
 * namespacing cache entries when multiple independent consumers share the same
 * cache backend.
 *
 * @param prefix - The string to prepend to every cache key.
 * @returns A middleware plugin that wraps an `ICacheAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/plugins"`
 * @typeParam TType - The type of values stored in the cache.
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

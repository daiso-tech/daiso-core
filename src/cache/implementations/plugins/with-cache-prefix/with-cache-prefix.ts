/**
 * @module Cache
 */

import type { ICacheAdapter } from "@/cache/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

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
 * IMPORT_PATH: `"eridu-tech/cache/plugins"`
 * @group Plugins
 */
export function withCachePrefix(prefix: string): PluginFn<ICacheAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "add", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "get", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "getAndRemove", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "increment", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "put", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "removeByPrefix", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "removeMany", ({ args: [keys, ...rest], next }) => {
            return next([keys.map(withPrefix), ...rest]);
        });
        enhance(adapter, "update", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "getOrAdd", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
    };
}

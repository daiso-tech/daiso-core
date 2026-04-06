/**
 * @module Cache
 */

import {
    type CacheAdapterVariants,
    type IDatabaseCacheAdapter,
} from "@/cache/contracts/_module.js";

/**
 * @internal
 */
export function isDatabaseCacheAdapter<TType>(
    adapter: CacheAdapterVariants<TType>,
): adapter is IDatabaseCacheAdapter<TType> {
    const adapter_ = adapter as Record<string, (...args: Array<any>) => any>;
    return (
        typeof adapter_["find"] === "function" &&
        typeof adapter_["transaction"] === "function" &&
        typeof adapter_["update"] === "function" &&
        typeof adapter_["removeMany"] === "function" &&
        typeof adapter_["removeAll"] === "function" &&
        typeof adapter_["removeByKeyPrefix"] === "function"
    );
}

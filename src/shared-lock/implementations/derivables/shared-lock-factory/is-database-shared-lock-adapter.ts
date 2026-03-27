/**
 * @module SharedLock
 */

import {
    type IDatabaseSharedLockAdapter,
    type SharedLockAdapterVariants,
} from "@/shared-lock/contracts/_module.js";

/**
 * @internal
 */
export function isDatabaseSharedLockAdapter(
    adapter: SharedLockAdapterVariants,
): adapter is IDatabaseSharedLockAdapter {
    const adapter_ = adapter as Partial<
        Record<string, (...args_: Array<unknown>) => unknown>
    >;

    return (
        typeof adapter_["transaction"] === "function" &&
        adapter_["transaction"].length === 1
    );
}

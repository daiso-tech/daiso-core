/**
 * @module Lock
 */
import {
    type IDatabaseLockAdapter,
    type LockAdapterVariants,
} from "@/lock/contracts/_module.js";

/**
 * @internal
 */
export function isDatabaseLockAdapter(
    adapter: LockAdapterVariants,
): adapter is IDatabaseLockAdapter {
    const adapter_ = adapter as Partial<
        Record<string, (...args_: Array<unknown>) => unknown>
    >;

    return (
        typeof adapter_["transaction"] === "function" &&
        adapter_["transaction"].length === 1 &&
        typeof adapter_["remove"] === "function" &&
        adapter_["remove"].length === 1 &&
        typeof adapter_["removeIfOwner"] === "function" &&
        adapter_["removeIfOwner"].length === 2 &&
        typeof adapter_["updateExpiration"] === "function" &&
        adapter_["updateExpiration"].length === 3 &&
        typeof adapter_["find"] === "function" &&
        adapter_["find"].length === 1
    );
}

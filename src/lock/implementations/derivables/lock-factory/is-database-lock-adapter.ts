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
        typeof adapter_["remove"] === "function" &&
        typeof adapter_["removeIfOwner"] === "function" &&
        typeof adapter_["updateExpiration"] === "function" &&
        typeof adapter_["find"] === "function"
    );
}

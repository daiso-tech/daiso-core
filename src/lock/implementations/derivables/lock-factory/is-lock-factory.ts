/**
 * @module Lock
 */

import {
    type ILockFactoryBase,
    type LockFactoryInput,
} from "@/lock/contracts/_module.js";

/**
 * @internal
 */
export function isLockFactory(
    lockFactoryInput: LockFactoryInput,
): lockFactoryInput is ILockFactoryBase {
    return (
        typeof lockFactoryInput === "object" &&
        "create" in lockFactoryInput &&
        typeof lockFactoryInput.create === "function"
    );
}

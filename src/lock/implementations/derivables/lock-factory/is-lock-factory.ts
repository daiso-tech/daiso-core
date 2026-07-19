/**
 * @module Lock
 */

import {
    type ILockFactory,
    type LockFactoryInput,
} from "@/lock/contracts/_module.js";

/**
 * @internal
 */
export function isLockFactory(
    lockFactoryInput: LockFactoryInput,
): lockFactoryInput is ILockFactory {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const lockFactoryInput_ = lockFactoryInput as any;
    return (
        typeof lockFactoryInput_ === "object" &&
        "create" in lockFactoryInput_ &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        typeof lockFactoryInput_.create === "function"
    );
}

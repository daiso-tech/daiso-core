/**
 * @module Lock
 */

import {
    type ILockFactory,
    type LockFactoryInput,
} from "@/lock/contracts/_module.js";
import { isLockFactory } from "@/lock/implementations/derivables/lock-factory/is-lock-factory.js";
import { LockFactory } from "@/lock/implementations/derivables/lock-factory/lock-factory.js";

/**
 * @internal
 */
export function resolveLockFactoryInput(
    lockFactoryInput: LockFactoryInput,
): ILockFactory {
    if (isLockFactory(lockFactoryInput)) {
        return lockFactoryInput;
    }
    return new LockFactory({
        adapter: lockFactoryInput,
    });
}

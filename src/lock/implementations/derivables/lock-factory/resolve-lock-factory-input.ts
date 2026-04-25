/**
 * @module Lock
 */

import {
    type ILockFactoryBase,
    type LockFactoryInput,
} from "@/lock/contracts/_module.js";
import { isLockFactory } from "@/lock/implementations/derivables/lock-factory/is-lock-factory.js";
import { LockFactory } from "@/lock/implementations/derivables/lock-factory/lock-factory.js";
import { type INamespace } from "@/namespace/contracts/_module.js";

/**
 * @internal
 */
export function resolveLockFactoryInput(
    namespace: INamespace,
    lockFactoryInput: LockFactoryInput,
): ILockFactoryBase {
    if (isLockFactory(lockFactoryInput)) {
        return lockFactoryInput;
    }
    return new LockFactory({
        namespace,
        adapter: lockFactoryInput,
    });
}

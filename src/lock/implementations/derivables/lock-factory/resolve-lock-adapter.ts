/**
 * @module Lock
 */
import {
    type LockAdapterVariants,
    type ILockAdapter,
} from "@/lock/contracts/_module.js";
import { DatabaseLockAdapter } from "@/lock/implementations/derivables/lock-factory/database-lock-adapter.js";
import { isDatabaseLockAdapter } from "@/lock/implementations/derivables/lock-factory/is-database-lock-adapter.js";

/**
 * @internal
 */
export function resolveLockAdapter(adapter: LockAdapterVariants): ILockAdapter {
    if (isDatabaseLockAdapter(adapter)) {
        return new DatabaseLockAdapter(adapter);
    }
    return adapter;
}

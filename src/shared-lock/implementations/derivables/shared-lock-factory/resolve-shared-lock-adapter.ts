/**
 * @module SharedLock
 */

import {
    type ISharedLockAdapter,
    type SharedLockAdapterVariants,
} from "@/shared-lock/contracts/_module.js";
import { DatabaseSharedLockAdapter } from "@/shared-lock/implementations/derivables/shared-lock-factory/database-shared-lock-adapter.js";
import { isDatabaseSharedLockAdapter } from "@/shared-lock/implementations/derivables/shared-lock-factory/is-database-shared-lock-adapter.js";

/**
 * @internal
 */
export function resolveSharedLockAdapter(
    adapter: SharedLockAdapterVariants,
): ISharedLockAdapter {
    if (isDatabaseSharedLockAdapter(adapter)) {
        return new DatabaseSharedLockAdapter(adapter);
    }
    return adapter;
}

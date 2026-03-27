/**
 * @module Semaphore
 */

import {
    type ISemaphoreAdapter,
    type SemaphoreAdapterVariants,
} from "@/semaphore/contracts/_module.js";
import { DatabaseSemaphoreAdapter } from "@/semaphore/implementations/derivables/semaphore-factory/database-semaphore-adapter.js";
import { isDatabaseSemaphoreAdapter } from "@/semaphore/implementations/derivables/semaphore-factory/is-database-semaphore-adapter.js";

/**
 * @internal
 */
export function resolveSemaphoreAdapter(
    adapter: SemaphoreAdapterVariants,
): ISemaphoreAdapter {
    if (isDatabaseSemaphoreAdapter(adapter)) {
        return new DatabaseSemaphoreAdapter(adapter);
    }
    return adapter;
}

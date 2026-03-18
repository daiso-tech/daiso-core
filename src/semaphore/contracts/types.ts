/**
 * @module Semaphore
 */

import { type IDatabaseSemaphoreAdapter } from "@/semaphore/contracts/database-semaphore-adapter.contract.js";
import { type ISemaphoreAdapter } from "@/semaphore/contracts/semaphore-adapter.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type SemaphoreAdapterVariants =
    | ISemaphoreAdapter
    | IDatabaseSemaphoreAdapter;

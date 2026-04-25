/**
 * @module Lock
 */

import { type IDatabaseLockAdapter } from "@/lock/contracts/database-lock-adapter.contract.js";
import { type ILockAdapter } from "@/lock/contracts/lock-adapter.contract.js";
import { type ILockFactoryBase } from "@/lock/contracts/lock-factory.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type LockAdapterVariants = ILockAdapter | IDatabaseLockAdapter;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type LockFactoryInput = LockAdapterVariants | ILockFactoryBase;

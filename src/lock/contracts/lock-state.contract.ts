/**
 * @module Lock
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export const LOCK_STATE = {
    EXPIRED: "EXPIRED",
    UNAVAILABLE: "UNAVAILABLE",
    ACQUIRED: "ACQUIRED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type LockStateLiterals = (typeof LOCK_STATE)[keyof typeof LOCK_STATE];

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockExpiredState = {
    type: (typeof LOCK_STATE)["EXPIRED"];
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockUnavailableState = {
    type: (typeof LOCK_STATE)["UNAVAILABLE"];
    owner: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockAcquiredState = {
    type: (typeof LOCK_STATE)["ACQUIRED"];
    remainingTime: TimeSpan | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockState =
    | ILockUnavailableState
    | ILockAcquiredState
    | ILockExpiredState;

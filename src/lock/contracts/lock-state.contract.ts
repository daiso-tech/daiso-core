/**
 * @module Lock
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Enumeration of lock operational states.
 * Represents the possible status conditions a lock can have at any point in time.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export const LOCK_STATE = {
    /**
     * Lock has expired and is no longer held by any owner.
     * The lock can be acquired by a new requester.
     */
    EXPIRED: "EXPIRED",

    /**
     * Lock is currently held by another owner and cannot be acquired.
     * Must wait for the owner to release it or for it to expire.
     */
    UNAVAILABLE: "UNAVAILABLE",

    /**
     * Lock is currently held by the requesting owner.
     * The owner has exclusive access to the protected resource.
     */
    ACQUIRED: "ACQUIRED",
} as const;

/**
 * Union type of lock state literals.
 * Represents the valid string values that indicate a lock's current status.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type LockStateLiterals = (typeof LOCK_STATE)[keyof typeof LOCK_STATE];

/**
 * Represents a lock that has expired and is no longer held.
 * In this state, any requester can acquire the lock.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockExpiredState = {
    /**
     * The state type indicator.
     */
    type: (typeof LOCK_STATE)["EXPIRED"];
};

/**
 * Represents a lock that is currently held by a different owner.
 * The requesting entity cannot acquire this lock until the owner releases it or it expires.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockUnavailableState = {
    /**
     * The state type indicator.
     */
    type: (typeof LOCK_STATE)["UNAVAILABLE"];

    /**
     * The unique identifier of the entity currently holding the lock.
     */
    owner: string;
};

/**
 * Represents a lock that is currently held by the requesting owner.
 * The owner has exclusive access to the protected resource for the duration of the remaining time.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockAcquiredState = {
    /**
     * The state type indicator.
     */
    type: (typeof LOCK_STATE)["ACQUIRED"];

    /**
     * The time remaining before the lock expires.
     * null indicates an indefinite lock with no expiration time.
     */
    remainingTime: TimeSpan | null;
};

/**
 * Union type representing any possible lock state.
 * Discriminated union using the `type` field to determine which specific state it is.
 * Use type guards or switch statements on the `type` field to narrow to specific states.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockState =
    | ILockUnavailableState
    | ILockAcquiredState
    | ILockExpiredState;

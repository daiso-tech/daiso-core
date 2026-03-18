/**
 * @module Lock
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars

import { type ILockStateMethods } from "@/lock/contracts/lock.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type LockEventBase = {
    lock: ILockStateMethods;
};

/**
 * The event is dispatched when a lock is aquired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type AcquiredLockEvent = LockEventBase;

/**
 * The event is dispatched when a lock is released.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type ReleasedLockEvent = LockEventBase;

/**
 * The event is dispatched when a lock is forcefully released.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type ForceReleasedLockEvent = LockEventBase & {
    hasReleased: boolean;
};

/**
 * The event is dispatched when trying to release a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type FailedReleaseLockEvent = LockEventBase;

/**
 * The event is dispatched when trying to refefresh a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type FailedRefreshLockEvent = LockEventBase;

/**
 * The event is dispatched when trying to acquire a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type UnavailableLockEvent = LockEventBase;

/**
 * The event is dispatched when a lock is refreshed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type RefreshedLockEvent = LockEventBase;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type UnexpectedErrorLockEvent = LockEventBase & {
    error: unknown;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export const LOCK_EVENTS = {
    ACQUIRED: "ACQUIRED",
    RELEASED: "RELEASED",
    FAILED_RELEASE: "FAILED_RELEASE",
    FAILED_REFRESH: "FAILED_REFRESH",
    UNAVAILABLE: "UNAVAILABLE",
    FORCE_RELEASED: "FORCE_RELEASED",
    REFRESHED: "REFRESHED",
    UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Events
 */
export type LockEventMap = {
    [LOCK_EVENTS.ACQUIRED]: AcquiredLockEvent;
    [LOCK_EVENTS.RELEASED]: ReleasedLockEvent;
    [LOCK_EVENTS.FAILED_RELEASE]: FailedReleaseLockEvent;
    [LOCK_EVENTS.FAILED_REFRESH]: FailedRefreshLockEvent;
    [LOCK_EVENTS.UNAVAILABLE]: UnavailableLockEvent;
    [LOCK_EVENTS.FORCE_RELEASED]: ForceReleasedLockEvent;
    [LOCK_EVENTS.REFRESHED]: RefreshedLockEvent;
    [LOCK_EVENTS.UNEXPECTED_ERROR]: UnexpectedErrorLockEvent;
};

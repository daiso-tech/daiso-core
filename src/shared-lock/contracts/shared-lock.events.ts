/**
 * @module SharedLock
 */

import { type ISharedLockStateMethods } from "@/shared-lock/contracts/shared-lock.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type LockEventBase = {
    sharedLock: ISharedLockStateMethods;
};

/**
 * The event is dispatched when a shared-lock is acquired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type AcquiredWriterLockEvent = LockEventBase;

/**
 * The event is dispatched when a shared-lock is released.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type ReleasedWriterLockEvent = LockEventBase;

/**
 * The event is dispatched when a shared-lock is forcefully released.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type ForceReleasedWriterLockEvent = LockEventBase & {
    hasReleased: boolean;
};

/**
 * The event is dispatched when trying to release a shared-lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type FailedReleaseWriterLockEvent = LockEventBase;

/**
 * The event is dispatched when trying to refresh a shared-lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type FailedRefreshWriterLockEvent = LockEventBase;

/**
 * The event is dispatched when
 * 1. Trying to acquire the shared-lock as writer when in reader mode.
 * 2. Trying to acquire the shared-lock as reader when in writer mode.
 * 3. trying to acquire a shared-lock that is owned by a different owner.
 * 4. Trying to acquire the shared-lock as reader when limit is reached.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type UnavailableSharedLockEvent = LockEventBase;

/**
 * The event is dispatched when a shared-lock is refreshed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type RefreshedWriterLockEvent = LockEventBase;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export const WRITER_LOCK_EVENTS = {
    WRITER_ACQUIRED: "WRITER_ACQUIRED",
    WRITER_RELEASED: "WRITER_RELEASED",
    WRITER_FAILED_RELEASE: "WRITER_FAILED_RELEASE",
    WRITER_FAILED_REFRESH: "WRITER_FAILED_REFRESH",
    WRITER_FORCE_RELEASED: "WRITER_FORCE_RELEASED",
    WRITER_REFRESHED: "WRITER_REFRESHED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type WriterLockEventMap = {
    [WRITER_LOCK_EVENTS.WRITER_ACQUIRED]: AcquiredWriterLockEvent;
    [WRITER_LOCK_EVENTS.WRITER_RELEASED]: ReleasedWriterLockEvent;
    [WRITER_LOCK_EVENTS.WRITER_FAILED_RELEASE]: FailedReleaseWriterLockEvent;
    [WRITER_LOCK_EVENTS.WRITER_FAILED_REFRESH]: FailedRefreshWriterLockEvent;
    // [WRITER_LOCK_EVENTS.WRITER_UNAVAILABLE]: UnavailableSharedLockEvent;
    [WRITER_LOCK_EVENTS.WRITER_FORCE_RELEASED]: ForceReleasedWriterLockEvent;
    [WRITER_LOCK_EVENTS.WRITER_REFRESHED]: RefreshedWriterLockEvent;
};

/**
 * The event is dispatched when a shared-lock slot is acquired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type AcquiredReaderSemaphoreEvent = LockEventBase;

/**
 * The event is dispatched when a shared-lock slot is released.
 * Note this event is only dispatched when the shared-lock slot is released and not when the shared-lock slot expired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type ReleasedReaderSemaphoreEvent = LockEventBase;

/**
 * The event is dispatched when all slot of semaphore are released.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type AllForceReleasedReaderSemaphoreEvent = LockEventBase & {
    hasReleased: boolean;
};

/**
 * The event is dispatched when trying to refresh a shared-lock slot that is already expired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type FailedRefreshReaderSemaphoreEvent = LockEventBase;

/**
 * The event is dispatched when trying to release a shared-lock slot that is already expired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type FailedReleaseReaderSemaphoreEvent = LockEventBase;

/**
 * The event is dispatched when a shared-lock slot is refreshed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type RefreshedReaderSemaphoreEvent = LockEventBase;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export const READER_SEMAPHORE_EVENTS = {
    READER_ACQUIRED: "READER_ACQUIRED",
    READER_RELEASED: "READER_RELEASED",
    READER_ALL_FORCE_RELEASED: "READER_ALL_FORCE_RELEASED",
    READER_FAILED_RELEASE: "READER_FAILED_RELEASE",
    READER_FAILED_REFRESH: "READER_FAILED_REFRESH",
    READER_REFRESHED: "READER_REFRESHED",
    READER_UNEXPECTED_ERROR: "READER_UNEXPECTED_ERROR",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type ReaderSemaphoreEventMap = {
    [READER_SEMAPHORE_EVENTS.READER_ACQUIRED]: AcquiredReaderSemaphoreEvent;
    [READER_SEMAPHORE_EVENTS.READER_RELEASED]: ReleasedReaderSemaphoreEvent;
    [READER_SEMAPHORE_EVENTS.READER_ALL_FORCE_RELEASED]: AllForceReleasedReaderSemaphoreEvent;
    [READER_SEMAPHORE_EVENTS.READER_FAILED_RELEASE]: FailedReleaseReaderSemaphoreEvent;
    [READER_SEMAPHORE_EVENTS.READER_FAILED_REFRESH]: FailedRefreshReaderSemaphoreEvent;
    [READER_SEMAPHORE_EVENTS.READER_REFRESHED]: RefreshedReaderSemaphoreEvent;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type UnexpectedErrorSharedLockEvent = LockEventBase & {
    error: unknown;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export const SHARED_LOCK_EVENTS = {
    ...READER_SEMAPHORE_EVENTS,
    ...WRITER_LOCK_EVENTS,
    UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
    UNAVAILABLE: "UNAVAILABLE",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Events
 */
export type SharedLockEventMap = ReaderSemaphoreEventMap &
    WriterLockEventMap & {
        [SHARED_LOCK_EVENTS.UNEXPECTED_ERROR]: UnexpectedErrorSharedLockEvent;
        [SHARED_LOCK_EVENTS.UNAVAILABLE]: UnavailableSharedLockEvent;
    };

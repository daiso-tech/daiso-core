/**
 * @module SharedLock
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export const SHARED_LOCK_WRITER_STATE = {
    WRITER_UNAVAILABLE: "WRITER_UNAVAILABLE",
    WRITER_ACQUIRED: "WRITER_ACQUIRED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type SharedLockWriterStateLiterals =
    (typeof SHARED_LOCK_WRITER_STATE)[keyof typeof SHARED_LOCK_WRITER_STATE];

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export const SHARED_LOCK_READER_STATE = {
    READER_LIMIT_REACHED: "READER_LIMIT_REACHED",
    READER_ACQUIRED: "READER_ACQUIRED",
    READER_UNACQUIRED: "READER_UNACQUIRED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type SharedLockReaderStateLiterals =
    (typeof SHARED_LOCK_READER_STATE)[keyof typeof SHARED_LOCK_READER_STATE];

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export const SHARED_LOCK_STATE = {
    EXPIRED: "EXPIRED",
    ...SHARED_LOCK_WRITER_STATE,
    ...SHARED_LOCK_READER_STATE,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type SharedLockState =
    (typeof SHARED_LOCK_STATE)[keyof typeof SHARED_LOCK_STATE];

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockExpiredState = {
    type: (typeof SHARED_LOCK_STATE)["EXPIRED"];
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockWriterUnavailableState = {
    type: (typeof SHARED_LOCK_WRITER_STATE)["WRITER_UNAVAILABLE"];

    owner: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockWriterAcquiredState = {
    type: (typeof SHARED_LOCK_WRITER_STATE)["WRITER_ACQUIRED"];
    remainingTime: TimeSpan | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockWriterState =
    | ISharedLockWriterUnavailableState
    | ISharedLockWriterAcquiredState;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockReaderUnacquiredState = {
    type: (typeof SHARED_LOCK_READER_STATE)["READER_UNACQUIRED"];
    limit: number;
    freeSlotsCount: number;
    acquiredSlotsCount: number;
    acquiredSlots: Array<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockReaderAcquiredState = {
    type: (typeof SHARED_LOCK_READER_STATE)["READER_ACQUIRED"];
    limit: number;
    remainingTime: TimeSpan | null;
    freeSlotsCount: number;
    acquiredSlotsCount: number;
    acquiredSlots: Array<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockReaderLimitReachedState = {
    type: (typeof SHARED_LOCK_READER_STATE)["READER_LIMIT_REACHED"];
    limit: number;
    acquiredSlots: Array<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockReaderState =
    | ISharedLockReaderUnacquiredState
    | ISharedLockReaderAcquiredState
    | ISharedLockReaderLimitReachedState;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockState =
    | ISharedLockExpiredState
    | ISharedLockWriterState
    | ISharedLockReaderState;

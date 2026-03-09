/**
 * @module Semaphore
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export const SEMAPHORE_STATE = {
    EXPIRED: "EXPIRED",
    LIMIT_REACHED: "LIMIT_REACHED",
    ACQUIRED: "ACQUIRED",
    UNACQUIRED: "UNACQUIRED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type SemaphoreStateLiterals =
    (typeof SEMAPHORE_STATE)[keyof typeof SEMAPHORE_STATE];

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreExpiredState = {
    type: (typeof SEMAPHORE_STATE)["EXPIRED"];
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreUnacquiredState = {
    type: (typeof SEMAPHORE_STATE)["UNACQUIRED"];
    limit: number;
    freeSlotsCount: number;
    acquiredSlotsCount: number;
    acquiredSlots: Array<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreAcquiredState = {
    type: (typeof SEMAPHORE_STATE)["ACQUIRED"];
    limit: number;
    remainingTime: TimeSpan | null;
    freeSlotsCount: number;
    acquiredSlotsCount: number;
    acquiredSlots: Array<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreLimitReachedState = {
    type: (typeof SEMAPHORE_STATE)["LIMIT_REACHED"];
    limit: number;
    acquiredSlots: Array<string>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreState =
    | ISemaphoreExpiredState
    | ISemaphoreAcquiredState
    | ISemaphoreUnacquiredState
    | ISemaphoreLimitReachedState;

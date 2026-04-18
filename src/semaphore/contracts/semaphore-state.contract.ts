/**
 * @module Semaphore
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Enumeration of semaphore operational states.
 * Represents the possible status conditions a semaphore can have, tracking slot availability and acquisition.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export const SEMAPHORE_STATE = {
    /**
     * All semaphore slots have expired.
     * If the semaphore has an expiration policy, an expired state indicates all slots can be reclaimed.
     */
    EXPIRED: "EXPIRED",

    /**
     * All available slots have been acquired and the limit is reached.
     * No additional slots can be acquired until existing slots are released or expire.
     */
    LIMIT_REACHED: "LIMIT_REACHED",

    /**
     * At least one slot has been successfully acquired by the requester.
     * The requester has exclusive control over one or more slots.
     */
    ACQUIRED: "ACQUIRED",

    /**
     * No slots have been acquired by the requester, but slots remain available.
     * The semaphore has available capacity for additional acquisitions.
     */
    UNACQUIRED: "UNACQUIRED",
} as const;

/**
 * Union type of semaphore state literals.
 * Represents the valid string values indicating a semaphore's current operational status.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type SemaphoreStateLiterals =
    (typeof SEMAPHORE_STATE)[keyof typeof SEMAPHORE_STATE];

/**
 * Represents a semaphore where all slots have expired.
 * In this state, the semaphore no longer holds any active slot acquisitions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreExpiredState = {
    /**
     * The state type indicator.
     */
    type: (typeof SEMAPHORE_STATE)["EXPIRED"];
};

/**
 * Represents a semaphore where the requester has not acquired any slots.
 * At least one slot remains available for acquisition.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreUnacquiredState = {
    /**
     * The state type indicator.
     */
    type: (typeof SEMAPHORE_STATE)["UNACQUIRED"];

    /**
     * The maximum number of slots that can be simultaneously held.
     */
    limit: number;

    /**
     * The number of slots currently available for acquisition.
     */
    freeSlotsCount: number;

    /**
     * The number of slots currently held by other requesters.
     */
    acquiredSlotsCount: number;

    /**
     * Array of unique identifiers for entities that currently hold acquired slots.
     */
    acquiredSlots: Array<string>;
};

/**
 * Represents a semaphore where at least one slot has been acquired by the requester.
 * The requester holds exclusive control over one or more slots.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreAcquiredState = {
    /**
     * The state type indicator.
     */
    type: (typeof SEMAPHORE_STATE)["ACQUIRED"];

    /**
     * The maximum number of slots that can be simultaneously held.
     */
    limit: number;

    /**
     * The time remaining before the acquired slots expire.
     * null indicates slots that do not expire.
     */
    remainingTime: TimeSpan | null;

    /**
     * The number of slots currently available for acquisition by other requesters.
     */
    freeSlotsCount: number;

    /**
     * The total number of slots currently held by this and other requesters.
     */
    acquiredSlotsCount: number;

    /**
     * Array of unique identifiers for all entities that currently hold acquired slots (including the requester).
     */
    acquiredSlots: Array<string>;
};

/**
 * Represents a semaphore where all available slots have been acquired.
 * No additional slots can be acquired until existing slots are released or expire.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreLimitReachedState = {
    /**
     * The state type indicator.
     */
    type: (typeof SEMAPHORE_STATE)["LIMIT_REACHED"];

    /**
     * The maximum number of slots that can be simultaneously held.
     */
    limit: number;

    /**
     * Array of unique identifiers for all entities that currently hold the acquired slots.
     */
    acquiredSlots: Array<string>;
};

/**
 * Union type representing any possible semaphore state.
 * Discriminated union using the `type` field to determine which specific state it is.
 * Use type guards or switch statements on the `type` field to narrow to specific states.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreState =
    | ISemaphoreExpiredState
    | ISemaphoreAcquiredState
    | ISemaphoreUnacquiredState
    | ISemaphoreLimitReachedState;

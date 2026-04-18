/**
 * @module Semaphore
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type ISemaphoreFactory } from "@/semaphore/contracts/semaphore-factory.contract.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Internal settings for semaphore slot acquisition operations.
 * This is used internally by adapters and should not be directly instantiated in application code.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type SemaphoreAcquireSettings = {
    /**
     * The current execution context where operations are performed.
     */
    context: IReadableContext;

    /**
     * The unique identifier for this semaphore instance.
     */
    key: string;

    /**
     * The unique identifier for the slot being acquired.
     * Used to track which slot is acquired by which holder.
     */
    slotId: string;

    /**
     * Maximum number of slots available in this semaphore.
     */
    limit: number;

    /**
     * Time-to-live duration for the acquired slot.
     * `null` means the slot does not expire.
     */
    ttl: TimeSpan | null;
};

/**
 * Represents the persistent state of a semaphore in storage.
 * Contains information about the slot limit and currently acquired slots with their expiration times.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreAdapterState = {
    /**
     * Maximum number of slots available in this semaphore.
     */
    limit: number;

    /**
     * A map of currently acquired slot IDs to their expiration dates.
     * A null value indicates an indefinite slot with no expiration.
     * Iteration order is not guaranteed and should not be relied upon.
     */
    acquiredSlots: Map<string, Date | null>;
};

/**
 * Technology-agnostic adapter contract for managing distributed semaphores.
 * Implementations handle slot acquisition, release, refresh, and state tracking independent of the underlying storage.
 * **Note:** This contract is low-level and typically not used directly - prefer {@link ISemaphoreFactory | `ISemaphoreFactory`} for semaphore usage.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreAdapter = {
    /**
     * Attempts to acquire a slot in the semaphore.
     * Succeeds only if the current number of acquired slots has not reached the limit.
     *
     * @param settings - Settings containing the context, key, slotId, limit, and ttl for the acquisition
     * @returns Promise resolving to true if the slot was successfully acquired, false if the slot limit has been reached
     */
    acquire(settings: SemaphoreAcquireSettings): Promise<boolean>;

    /**
     * Releases a specific slot if it is currently acquired.
     * Only the holder of the slot (identified by slotId) can release it.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the semaphore
     * @param slotId - Unique identifier of the slot to release
     * @returns Promise resolving to true if the slot was successfully released, false if the slot doesn't exist or is already released
     */
    release(
        context: IReadableContext,
        key: string,
        slotId: string,
    ): Promise<boolean>;

    /**
     * Forcibly releases all slots for the specified semaphore regardless of ownership.
     * Used for emergency cleanup or administrative operations.
     * Bypasses ownership verification for situations where individual slot holders are unavailable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the semaphore
     * @returns Promise resolving to true if the semaphore existed and slots were released, false if the semaphore doesn't exist or has no acquired slots
     */
    forceReleaseAll(context: IReadableContext, key: string): Promise<boolean>;

    /**
     * Refreshes (extends) the time-to-live of an existing slot.
     * Only succeeds if all conditions are met: the slot exists, hasn't expired, and is expirable.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the semaphore
     * @param slotId - Unique identifier of the slot to refresh
     * @param ttl - New time-to-live duration to set
     * @returns Promise resolving to true if refresh succeeded, false if the slot is unexpirable, expired, or doesn't exist
     */
    refresh(
        context: IReadableContext,
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean>;

    /**
     * Retrieves the current state of a semaphore.
     *
     * @param context - Readable execution context for the operation
     * @param key - Unique identifier for the semaphore
     * @returns Promise resolving to the non-expired semaphore state if it exists; otherwise null for missing or expired semaphores
     */
    getState(
        context: IReadableContext,
        key: string,
    ): Promise<ISemaphoreAdapterState | null>;
};

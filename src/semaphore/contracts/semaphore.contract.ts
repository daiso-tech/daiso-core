/**
 * @module Semaphore
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type ISemaphoreState } from "@/semaphore/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import { type AsyncLazy } from "@/utilities/_module.js";

/**
 * State and metadata methods for a semaphore instance.
 * Provides read-only access to semaphore state and configuration properties.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreStateMethods = {
    /**
     * Retrieves the current state of the semaphore.
     *
     * @returns The current semaphore state (available slots, acquired slots, expiration status, etc.)
     */
    getState(): Promise<ISemaphoreState>;

    /**
     * The unique identifier for this semaphore instance.
     * Multiple semaphore instances with the same key share the same slot pool.
     */
    readonly key: IKey;

    /**
     * The unique identifier for the slot holder (semaphore instance).
     * Used to track which slots are acquired by this holder.
     */
    readonly id: string;

    /**
     * The time-to-live (TTL) duration before acquired slots automatically expire.
     * `null` indicates slots do not expire and must be explicitly released.
     */
    readonly ttl: TimeSpan | null;
};

/**
 * Base operations for managing semaphore slot acquisition, release, and refresh cycles.
 * Provides both safe (boolean-returning) and strict (error-throwing) versions of slot operations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreBase = {
    /**
     * Executes an async function while holding a semaphore slot.
     * Automatically acquires a slot before execution and releases it after completion.
     * Throws an error if a slot cannot be acquired.
     *
     * @template TValue - The return type of the async function
     * @param asyncFn - The function to execute under semaphore protection
     * @returns The return value of the function
     * @throws {LimitReachedSemaphoreError} If all slots are already acquired
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * Attempts to acquire a semaphore slot if the limit is not reached.
     *
     * @returns true if a slot was successfully acquired, false if the limit is reached
     */
    acquire(): Promise<boolean>;

    /**
     * Acquires a semaphore slot if the limit is not reached.
     * Throws an error if a slot cannot be acquired.
     *
     * @throws {LimitReachedSemaphoreError} If all slots are already acquired
     */
    acquireOrFail(): Promise<void>;

    /**
     * Releases the currently held semaphore slot.
     *
     * @returns true if a slot was successfully released, false if no slot was held
     */
    release(): Promise<boolean>;

    /**
     * Releases the currently held semaphore slot.
     * Throws an error if no slot is currently held.
     *
     * @throws {FailedReleaseSemaphoreError} If no slot is held
     */
    releaseOrFail(): Promise<void>;

    /**
     * Forces release of all slots for this semaphore key, regardless of ownership.
     * Use with caution as it can break semaphore guarantees.
     *
     * @returns true if slots existed and were released, false if already empty
     */
    forceReleaseAll(): Promise<boolean>;

    /**
     * Refreshes (extends) the current slot's TTL if it is expirable.
     * Updates the expiration time to prevent the slot from timing out.
     *
     * @param ttl - New TTL duration. If not provided, uses the semaphore's original TTL
     * @returns true if the slot was successfully refreshed, false if not currently held
     */
    refresh(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * Refreshes (extends) the current slot's TTL if it is expirable.
     * Throws an error if the slot cannot be refreshed.
     *
     * @param ttl - New TTL duration. If not provided, uses the semaphore's original TTL
     * @throws {FailedRefreshSemaphoreError} If no slot is held or slot is not expirable
     */
    refreshOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * High-level semaphore interface combining state methods and base operations.
 * Provides a complete counting semaphore API for managing concurrent resource access.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphore = ISemaphoreStateMethods & ISemaphoreBase;

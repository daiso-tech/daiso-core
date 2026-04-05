/**
 * @module Semaphore
 */

import { type IReadableContext } from "@/execution-context/contracts/execution-context.contract.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type ISemaphoreFactory } from "@/semaphore/contracts/semaphore-factory.contract.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type SemaphoreAcquireSettings = {
    context: IReadableContext;
    key: string;
    slotId: string;
    limit: number;
    ttl: TimeSpan | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreAdapterState = {
    limit: number;
    acquiredSlots: Map<string, Date | null>;
};

/**
 * The `ISemaphoreAdapter` contract defines a way for managing semaphores independent of the underlying technology.
 * This contract is not meant to be used directly, instead you should use {@link ISemaphoreFactory | `ISemaphoreFactory`} contract.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreAdapter = {
    /**
     * The `acquire` method acquires a slot only if the slot limit is not reached.
     *
     * @returns Returns true if the slot limit is not reached otherwise false is returned.
     */
    acquire(settings: SemaphoreAcquireSettings): Promise<boolean>;

    /**
     * The `release` method releases given slot related to the key.
     *
     * @returns Returns true if the semaphore exists and has at least one unavailable slot or false if all slots are available.
     */
    release(
        context: IReadableContext,
        key: string,
        slotId: string,
    ): Promise<boolean>;

    /**
     * The `forceReleaseAll` method releases all slots related to the key.
     */
    forceReleaseAll(context: IReadableContext, key: string): Promise<boolean>;

    /**
     * The `refresh` method expiration of slot if not already expired.
     *
     * @returns Returns true if the slot is refreshed* otherwise false is returned.
     */
    refresh(
        context: IReadableContext,
        key: string,
        slotId: string,
        ttl: TimeSpan,
    ): Promise<boolean>;

    /**
     * The `getState` method returns the state of the semaphore.
     *
     * @returns Returns {@link ISemaphoreAdapterState | `ISemaphoreAdapterState`} if the semaphore exists in the database or null if doesnt exists.
     */
    getState(
        context: IReadableContext,
        key: string,
    ): Promise<ISemaphoreAdapterState | null>;
};

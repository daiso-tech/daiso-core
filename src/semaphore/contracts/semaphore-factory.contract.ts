/**
 * @module Semaphore
 */

import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type ISemaphore } from "@/semaphore/contracts/semaphore.contract.js";
import { type SemaphoreEventMap } from "@/semaphore/contracts/semaphore.events.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * The `ISemaphoreListenable` contract defines a way for listening {@link ISemaphore | `ISemaphore`} operations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreListenable = IEventListenable<SemaphoreEventMap>;

/**
 * Configuration settings for creating a semaphore instance through the factory.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type SemaphoreFactoryCreateSettings = {
    /**
     * Maximum number of concurrent slots that can be acquired.
     * When this limit is reached, further acquire attempts will be blocked until a slot is released.
     * This is a required setting that defines the semaphore's capacity.
     */
    limit: number;

    /**
     * Time-to-live (TTL) duration for acquired slots.
     * When set, each acquired slot will automatically expire after this duration.
     * Pass `null` to create slots without automatic expiration.
     */
    ttl?: ITimeSpan | null;

    /**
     * Custom identifier for slot tracking within this semaphore.
     * Used to uniquely identify the slot holder and manage slot state.
     * If not specified, a unique identifier will be automatically generated.
     */
    slotId?: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreFactoryBase = {
    /**
     * The `create` method is used to create an instance of {@link ISemaphore | `ISemaphore`}.
     */
    create(key: string, settings: SemaphoreFactoryCreateSettings): ISemaphore;
};

/**
 * The `ISemaphoreFactory` contract defines a way for managing semaphores independent of the underlying technology.
 * It comes with more convenient methods compared to `ISemaphoreAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreFactory = ISemaphoreFactoryBase & {
    readonly events: ISemaphoreListenable;
};

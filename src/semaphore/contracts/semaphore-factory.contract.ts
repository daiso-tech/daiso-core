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
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type SemaphoreFactoryCreateSettings = {
    limit: number;

    /**
     * You can also provide a `settings.ttl` value using. If not specified it defaults to null, meaning no TTL is applied.
     */
    ttl?: ITimeSpan | null;

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

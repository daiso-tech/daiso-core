/**
 * @module SharedLock
 */

import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type ISharedLock } from "@/shared-lock/contracts/shared-lock.contract.js";
import { type SharedLockEventMap } from "@/shared-lock/contracts/shared-lock.events.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * The `ISharedLockListenable` contract defines a way for listening {@link ISharedLock | `ISharedLock`} operations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockListenable = IEventListenable<SharedLockEventMap>;

/**
 * Configuration settings for creating a shared lock instance through the factory.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type SharedLockFactoryCreateSettings = {
    /**
     * Maximum number of concurrent readers that can hold a read lock simultaneously.
     * This defines the semaphore limit for the reader component of the shared lock.
     */
    limit: number;

    /**
     * Time-to-live (TTL) duration for the locks.
     * When set, locks will automatically expire after this duration if not refreshed.
     * Pass `null` to create locks without automatic expiration.
     */
    ttl?: ITimeSpan | null;

    /**
     * Custom identifier for this shared-lock holder.
     * Used to uniquely identify writer ownership and reader slot ownership.
     * If not specified, a unique identifier will be automatically generated.
     */
    lockId?: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockFactoryBase = {
    /**
     * The `create` method is used to create an instance of {@link ISharedLock | `ISharedLock`}.
     */
    create(key: string, settings: SharedLockFactoryCreateSettings): ISharedLock;
};

/**
 * The `ISharedLockFactory` contract defines a way for managing locks independent of the underlying technology.
 * It comes with more convenient methods compared to `ISharedLockAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockFactory = ISharedLockFactoryBase & {
    readonly events: ISharedLockListenable;
};

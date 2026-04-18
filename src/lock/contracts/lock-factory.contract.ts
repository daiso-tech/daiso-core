/**
 * @module Lock
 */

import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type ILock } from "@/lock/contracts/lock.contract.js";
import { type LockEventMap } from "@/lock/contracts/lock.events.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * The `ILockListenable` contract defines a way for listening {@link ILock | `ILock`} operations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockListenable = IEventListenable<LockEventMap>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type LockFactoryCreateSettings = {
    /**
     * Time-to-live (TTL) duration for the lock.
     * When set, the lock will automatically expire after this duration if not refreshed.
     * Pass `null` to create a lock without expiration.
     */
    ttl?: ITimeSpan | null;

    /**
     * Custom identifier for the lock instance.
     * Used to uniquely identify the lock holder and prevent conflicts with other lock owners.
     * If not specified, a unique identifier will be automatically generated.
     */
    lockId?: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockFactoryBase = {
    /**
     * The `create` method is used to create an instance of {@link ILock | `ILock`}.
     */
    create(key: string, settings?: LockFactoryCreateSettings): ILock;
};

/**
 * The `ILockFactory` contract defines a way for managing locks independent of the underlying technology.
 * It comes with more convenient methods compared to `ILockAdapter`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockFactory = ILockFactoryBase & {
    readonly events: ILockListenable;
};

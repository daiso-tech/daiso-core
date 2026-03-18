/**
 * @module SharedLock
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type ISharedLockProvider } from "@/shared-lock/contracts/shared-lock-provider.contract.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLockAdapterState = {
    owner: string;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreAdapterState = {
    limit: number;
    acquiredSlots: Map<string, Date | null>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockAdapterState = {
    writer: IWriterLockAdapterState | null;
    reader: IReaderSemaphoreAdapterState | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type SharedLockAcquireSettings = {
    key: string;
    lockId: string;
    limit: number;
    ttl: TimeSpan | null;
};

/**
 * The `ISharedLockAdapter` contract defines a way for managing locks independent of the underlying technology.
 * This contract is not meant to be used directly, instead you should use {@link ISharedLockProvider | `ISharedLockProvider`} contract.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockAdapter = {
    /**
     * The `acquireWriter` method acquires a lock only if expired.
     *
     * @returns Returns `true` if expired otherwise `false` is returned.
     */
    acquireWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
    ): Promise<boolean>;

    /**
     * The `releaseWriter` method releases a lock if the owner matches.
     *
     * @returns Returns `true` if released otherwise `false` is returned.
     */
    releaseWriter(key: string, lockId: string): Promise<boolean>;

    /**
     * The `forceReleaseWriter` method releases a lock regardless of the owner.
     *
     * @returns Returns `true` if the lock exists or `false` if the lock is expired.
     */
    forceReleaseWriter(key: string): Promise<boolean>;

    /**
     * The `refreshWriter` method will upadte `ttl` of lock if it matches the `owner` and is expireable.
     *
     * @returns Returns `false` if the lock is unexpireable, the is expired, does not match the `owner` otherwise `true` is returned.
     */
    refreshWriter(key: string, lockId: string, ttl: TimeSpan): Promise<boolean>;

    /**
     * The `acquireReader` method acquires a slot only if the slot limit is not reached.
     *
     * @returns Returns true if the slot limit is not reached otherwise false is returned.
     */
    acquireReader(settings: SharedLockAcquireSettings): Promise<boolean>;

    /**
     * The `releaseReader` method releases given slot related to the key.
     *
     * @returns Returns true if the semaphore exists and has at least one unavailable slot or false if all slots are available.
     */
    releaseReader(key: string, slotId: string): Promise<boolean>;

    /**
     * The `forceReleaseAllReaders` method releases all slots related to the key.
     */
    forceReleaseAllReaders(key: string): Promise<boolean>;

    /**
     * The `refreshReader` method expiration of slot if not already expired.
     *
     * @returns Returns true if the slot is refreshed* otherwise false is returned.
     */
    refreshReader(key: string, slotId: string, ttl: TimeSpan): Promise<boolean>;

    forceRelease(key: string): Promise<boolean>;

    getState(key: string): Promise<ISharedLockAdapterState | null>;
};

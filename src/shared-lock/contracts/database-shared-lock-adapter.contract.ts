/**
 * @module SharedLock
 */

import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLockExpirationData = {
    /**
     * The expiration date and time of the lock.
     * `null` indicates the lock does not expire.
     */
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLockData = IWriterLockExpirationData & {
    /**
     * The identifier of the entity currently holding the lock.
     */
    owner: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreSlotExpirationData = {
    /**
     * The expiration date and time of the semaphore.
     * `null` indicates the semaphore does not expire.
     */
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreSlotData = IReaderSemaphoreSlotExpirationData & {
    id: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphoreData = {
    limit: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseWriterLockTransaction = {
    find(key: string): Promise<IWriterLockData | null>;

    upsert(key: string, lockId: string, expiration: Date | null): Promise<void>;

    /**
     * Removes a lock from the database regardless of its lock id.
     *
     * @param key The unique identifier for the lock to remove.
     */
    remove(key: string): Promise<IWriterLockExpirationData | null>;

    /**
     * Removes a lock from the database only if it is currently held by the specified lock id.
     *
     * @param key The unique identifier for the lock.
     * @param lockId The identifier of the expected lock.
     * @returns Returns {@link IWriterLockData |`IWriterLockData | null`}. The {@link IWriterLockData |`IWriterLockData`} data if successfully removed, otherwise `null` if the lock wasn't found or the owner didn't match.
     */
    removeIfOwner(key: string, lockId: string): Promise<IWriterLockData | null>;

    /**
     * Updates the expiration date of a lock if it is currently held by the specified lock id.
     *
     * @param key The unique identifier for the lock.
     * @param lockId The identifier of the expected lock.
     * @param expiration The new date and time when the lock should expire.
     * @returns Returns a number greater than or equal to `1` if the lock's expiration was updated, or `0` if the lock wasn't found or the lock id didn't match.
     */
    updateExpiration(
        key: string,
        lockId: string,
        expiration: Date,
    ): Promise<number>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseReaderSemaphoreTransaction = {
    /**
     * The `findSemaphore` returns the semaphore if it exists otherwise `null` is returned.
     */
    findSemaphore(key: string): Promise<IReaderSemaphoreData | null>;

    /**
     * The `findSlots` returns the semaphore slot if it exists otherwise `null` is returned.
     *
     */
    findSlots(key: string): Promise<Array<IReaderSemaphoreSlotData>>;

    /**
     * The `upsertSemaphore` inserts a semaphore if it doesnt exist otherwise it will be updated.
     */
    upsertSemaphore(key: string, limit: number): Promise<void>;

    /**
     * The `upsertSlot` inserts a semaphore slot if it doesnt exist otherwise it will be updated.
     */
    upsertSlot(
        key: string,
        lockId: string,
        expiration: Date | null,
    ): Promise<void>;

    /**
     * The `removeSlot` removes the specified slot.
     *
     * @returns Returns the slot expiration.
     */
    removeSlot(
        key: string,
        slotId: string,
    ): Promise<IReaderSemaphoreSlotExpirationData | null>;

    /**
     * The `removeAllSlots` removes all slots of the given semaphore.
     *
     * @returns Returns the slot expiration.
     */
    removeAllSlots(
        key: string,
    ): Promise<Array<IReaderSemaphoreSlotExpirationData>>;

    /**
     * The `updateExpiration` updates the specified slot expiration as long as it is expireable and unexpired of the given semaphore.
     *
     * @returns Returns a number greater than `0` if the slot expiration was updated, otherwise returns `0`.
     */
    updateExpiration(
        key: string,
        slotId: string,
        expiration: Date,
    ): Promise<number>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseSharedLockTransaction = {
    reader: IDatabaseReaderSemaphoreTransaction;
    writer: IDatabaseWriterLockTransaction;
};

/**
 * The `IDatabaseSharedLockAdapter` contract defines a way for managing shared locks independent of data storage.
 * This contract simplifies the implementation of lock adapters with CRUD-based databases, such as SQL databases and ORMs like TypeOrm and MikroOrm.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Contracts
 */
export type IDatabaseSharedLockAdapter = {
    transaction<TReturn>(
        fn: InvokableFn<
            [transaction: IDatabaseSharedLockTransaction],
            Promise<TReturn>
        >,
    ): Promise<TReturn>;
};

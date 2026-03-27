/**
 * @module Lock
 */

import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockExpirationData = {
    /**
     * The expiration date and time of the lock.
     * `null` indicates the lock does not expire.
     */
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockData = ILockExpirationData & {
    /**
     * The identifier of the entity currently holding the lock.
     */
    owner: string;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type IDatabaseLockTransaction = {
    /**
     * The `find` method retrieves the current lock data for a given key.
     *
     * @param key The unique identifier for the lock.
     * @returns Returns the lock's owner and expiration data if found, otherwise `null`.
     */
    find(key: string): Promise<ILockData | null>;

    /**
     * The `upsert` inserts a lock if it doesnt exist otherwise it will be updated.
     *
     * @param key The unique identifier for the lock.
     */
    upsert(key: string, lockId: string, expiration: Date | null): Promise<void>;
};

/**
 * The `IDatabaseLockAdapter` contract defines a way for managing locks independent of data storage.
 * This contract simplifies the implementation of lock adapters with CRUD-based databases, such as SQL databases and ORMs like TypeOrm and MikroOrm.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type IDatabaseLockAdapter = {
    /**
     * The `transaction` method runs the `fn` function inside a transaction.
     * The `fn` function is given a {@link IDatabaseLockTransaction | `IDatabaseLockTransaction`} object.
     *
     * Note when implementing this method use the strictest transaction level mode.
     */
    transaction<TReturn>(
        fn: InvokableFn<
            [transaction: IDatabaseLockTransaction],
            Promise<TReturn>
        >,
    ): Promise<TReturn>;

    /**
     * Removes a lock from the database regardless of its lock id.
     *
     * @param key The unique identifier for the lock to remove.
     */
    remove(key: string): Promise<ILockExpirationData | null>;

    /**
     * Removes a lock from the database only if it is currently held by the specified lock id.
     *
     * @param key The unique identifier for the lock.
     * @param lockId The identifier of the expected lock.
     * @returns Returns {@link ILockExpirationData |`ILockExpirationData | null`}. The {@link ILockExpirationData |`ILockExpirationData`} data if successfully removed, otherwise `null` if the lock wasn't found or the owner didn't match.
     */
    removeIfOwner(key: string, lockId: string): Promise<ILockData | null>;

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

    /**
     * The `find` method retrieves the current lock data for a given key.
     *
     * @param key The unique identifier for the lock.
     * @returns Returns the lock's id and expiration data if found, otherwise `null`.
     */
    find(key: string): Promise<ILockData | null>;
};

/**
 * @module Lock
 */

import { type ILockState } from "@/lock/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type FailedAcquireLockError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type FailedReleaseLockError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type FailedRefreshLockError,
} from "@/lock/contracts/lock.errors.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type AsyncLazy,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Invokable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type LockAquireBlockingSettings = {
    time?: ITimeSpan;
    interval?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockStateMethods = {
    getState(): Promise<ILockState>;

    /**
     * The `key` of the `ILock` instance.
     */
    readonly key: IKey;

    /**
     * The `id` of the `ILock` instance.
     */
    readonly id: string;

    /**
     * The `ttl` of `ILock` instance.
     */
    readonly ttl: TimeSpan | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILockBase = {
    /**
     * The `runOrFail` method wraps an {@link Invokable | `Invokable`} with the `acquireOrFail` and `release` method.
     * @throws {FailedAcquireLockError} {@link FailedAcquireLockError}
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * The `acquire` method acquires a lock only if the key is not already acquired by different owner.
     *
     * @returns Returns true if the lock is not already acquired otherwise false is returned.
     */
    acquire(): Promise<boolean>;

    /**
     * The `acquireOrFail` method acquires a lock only if the key is not already acquired by different owner.
     * Throws an error if the lock is already acquired by different owner.
     *
     * @throws {FailedAcquireLockError} {@link FailedAcquireLockError}
     */
    acquireOrFail(): Promise<void>;

    /**
     * The `release` method releases a lock if owned by the same owner.
     *
     * @returns Returns true if the lock is released otherwise false is returned.
     */
    release(): Promise<boolean>;

    /**
     * The `releaseOrFail` method releases a lock if owned by the same owner.
     * Throws an error if the lock is not owned by same owner.
     *
     * @throws {FailedReleaseLockError} {@link FailedReleaseLockError}
     */
    releaseOrFail(): Promise<void>;

    /**
     * The `forceRelease` method releases a lock regardless of the owner.
     *
     * @returns Returns true if the lock exists or false if the lock doesnt exists.
     */
    forceRelease(): Promise<boolean>;

    /**
     * The `refresh` method updates the `ttl` of the lock if expireable and owned by the same owner.
     *
     * @returns Returns true if the lock is refreshed otherwise false is returned.
     */
    refresh(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * The `refreshOrFail` method updates the `ttl` of the lock if expireable and owned by the same owner.
     * Throws an error if the lock is not owned by same owner.
     * Throws an error if the key is unexpirable.
     *
     * @throws {FailedRefreshLockError} {@link FailedRefreshLockError}
     */
    refreshOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Contracts
 */
export type ILock = ILockBase & ILockStateMethods;

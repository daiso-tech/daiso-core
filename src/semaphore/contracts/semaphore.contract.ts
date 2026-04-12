/**
 * @module Semaphore
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type ISemaphoreState } from "@/semaphore/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type LimitReachedSemaphoreError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type FailedRefreshSemaphoreError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type FailedReleaseSemaphoreError,
} from "@/semaphore/contracts/semaphore.errors.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";
import {
    type AsyncLazy,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Invokable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreStateMethods = {
    getState(): Promise<ISemaphoreState>;

    /**
     * The `key` of the `ISemaphore` instance.
     */
    readonly key: IKey;

    /**
     * The `id` of the `ISemaphore` instance.
     */
    readonly id: string;

    /**
     * The `ttl` of `ISemaphore` instance.
     */
    readonly ttl: TimeSpan | null;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreBase = {
    /**
     * The `runOrFail` method wraps an {@link Invokable | `Invokable`} with the `acquireOrFail` and `release` method.
     * @throws {LimitReachedSemaphoreError} {@link LimitReachedSemaphoreError}
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * The `acquire` method acquires an slots only if the slot limit is not reached.
     *
     * @returns Returns true if the slot limit is not reached otherwise false is returned.
     */
    acquire(): Promise<boolean>;

    /**
     * The `acquireOrFail` method acquires an slots only if the slot limit is not reached.
     * Throws an error if the slot limit is reached.
     *
     * @throws {LimitReachedSemaphoreError} {@link LimitReachedSemaphoreError}
     */
    acquireOrFail(): Promise<void>;

    /**
     * The `release` method releases the current slot.
     *
     * @returns Returns true if the semaphore exists and has at least one busy slot or false.
     */
    release(): Promise<boolean>;

    /**
     * The `releaseOrFail` method releases the current slot.
     * Throws an error if the slot is not acquired.
     * @throws {FailedReleaseSemaphoreError} {@link FailedReleaseSemaphoreError}
     */
    releaseOrFail(): Promise<void>;

    /**
     * The `forceReleaseAll` method releases the all slots.
     *
     * @returns Returns true if the semaphore exists and has at least one unavailable slot or false if all slots are available.
     */
    forceReleaseAll(): Promise<boolean>;

    /**
     * The `refresh` method updates the `ttl` of the slot when acquired.
     *
     * @returns Returns true if the slot is refreshed otherwise false is returned.
     */
    refresh(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * The `refreshOrFail` method updates the `ttl` of the slot when acquired.
     * Throws an error if the slot is not acquired.
     * @throws {FailedRefreshSemaphoreError} {@link FailedRefreshSemaphoreError}
     */
    refreshOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphore = ISemaphoreStateMethods & ISemaphoreBase;

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
import { type ITask } from "@/task/contracts/_module.js";
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
    getState(): ITask<ISemaphoreState>;

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
export type SemaphoreAquireBlockingSettings = {
    time?: ITimeSpan;
    interval?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphoreBase = {
    /**
     * The `runOrFail` method wraps an {@link Invokable | `Invokable`} or {@link ITask | `ITask`} with the `acquireOrFail` and `release` method.
     * @throws {LimitReachedSemaphoreError} {@link LimitReachedSemaphoreError}
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): ITask<TValue>;

    /**
     * The `runBlockingOrFail` method wraps an {@link Invokable | `Invokable`} or {@link ITask | `ITask`} with the `acquireBlockingOrFail` and `release` method.
     * @throws {LimitReachedSemaphoreError} {@link LimitReachedSemaphoreError}
     */
    runBlockingOrFail<TValue = void>(
        asyncFn: AsyncLazy<TValue>,
        settings?: SemaphoreAquireBlockingSettings,
    ): ITask<TValue>;

    /**
     * The `acquire` method acquires an slots only if the slot limit is not reached.
     *
     * @returns Returns true if the slot limit is not reached otherwise false is returned.
     */
    acquire(): ITask<boolean>;

    /**
     * The `acquireOrFail` method acquires an slots only if the slot limit is not reached.
     * Throws an error if the slot limit is reached.
     *
     * @throws {LimitReachedSemaphoreError} {@link LimitReachedSemaphoreError}
     */
    acquireOrFail(): ITask<void>;

    /**
     * The `acquireBlocking` method acquires an slots only if the slot limit is not reached.
     * If the slot limit is reached, it retries every `settings.interval` until `settings.time` is reached.
     *
     * @returns Returns true if the slot limit is not reached otherwise false is returned.
     */
    acquireBlocking(settings?: SemaphoreAquireBlockingSettings): ITask<boolean>;

    /**
     * The `acquireBlockingOrFail` method acquires an slots only if the slot limit is not reached.
     * If the slot limit is reached, it retries every `settings.interval` until `settings.time` is reached.
     * Throws an error if the slot limit is reached after the given `settings.time`.
     *
     * @throws {LimitReachedSemaphoreError} {@link LimitReachedSemaphoreError}
     */
    acquireBlockingOrFail(
        settings?: SemaphoreAquireBlockingSettings,
    ): ITask<void>;

    /**
     * The `release` method releases the current slot.
     *
     * @returns Returns true if the semaphore exists and has at least one busy slot or false.
     */
    release(): ITask<boolean>;

    /**
     * The `releaseOrFail` method releases the current slot.
     * Throws an error if the slot is not acquired.
     * @throws {FailedReleaseSemaphoreError} {@link FailedReleaseSemaphoreError}
     */
    releaseOrFail(): ITask<void>;

    /**
     * The `forceReleaseAll` method releases the all slots.
     *
     * @returns Returns true if the semaphore exists and has at least one unavailable slot or false if all slots are available.
     */
    forceReleaseAll(): ITask<boolean>;

    /**
     * The `refresh` method updates the `ttl` of the slot when acquired.
     *
     * @returns Returns true if the slot is refreshed otherwise false is returned.
     */
    refresh(ttl?: ITimeSpan): ITask<boolean>;

    /**
     * The `refreshOrFail` method updates the `ttl` of the slot when acquired.
     * Throws an error if the slot is not acquired.
     * @throws {FailedRefreshSemaphoreError} {@link FailedRefreshSemaphoreError}
     */
    refreshOrFail(ttl?: ITimeSpan): ITask<void>;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Contracts
 */
export type ISemaphore = ISemaphoreStateMethods & ISemaphoreBase;

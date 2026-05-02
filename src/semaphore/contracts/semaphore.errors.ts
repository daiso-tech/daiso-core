/**
 * @module Semaphore
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type InferInstance } from "@/utilities/_module.js";

/**
 * The error is thrown when trying to acquire a semaphore slot, but all slots are already taken.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Errors
 */
export class LimitReachedSemaphoreError extends Error {
    static create(key: IKey, cause?: unknown): LimitReachedSemaphoreError {
        return new LimitReachedSemaphoreError(
            `Key "${key.get()}" has reached the limit`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `LimitReachedSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = LimitReachedSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to refresh a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Errors
 */
export class FailedRefreshSemaphoreError extends Error {
    static create(
        key: IKey,
        slotId: string,
        cause?: unknown,
    ): FailedRefreshSemaphoreError {
        return new FailedRefreshSemaphoreError(
            `Failed to refresh slot "${slotId}" of key "${key.get()}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedRefreshSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to release a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Errors
 */
export class FailedReleaseSemaphoreError extends Error {
    static create(
        key: IKey,
        slotId: string,
        cause?: unknown,
    ): FailedReleaseSemaphoreError {
        return new FailedReleaseSemaphoreError(
            `Failed to release slot "${slotId}" of key "${key.get()}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedReleaseSemaphoreError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Errors
 */
export const SEMAPHORE_ERRORS = {
    ReachedLimit: LimitReachedSemaphoreError,
    FailedRefresh: FailedRefreshSemaphoreError,
    FailedRelease: FailedReleaseSemaphoreError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Errors
 */
export type AllSemaphoreErrors = InferInstance<
    (typeof SEMAPHORE_ERRORS)[keyof typeof SEMAPHORE_ERRORS]
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/semaphore/contracts"`
 * @group Errors
 */
export function isSemaphoreError(value: unknown): value is AllSemaphoreErrors {
    for (const errorClass of Object.values(SEMAPHORE_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

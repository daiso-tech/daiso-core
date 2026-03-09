/**
 * @module SharedLock
 */

import { type IKey } from "@/namespace/contracts/_module.js";

/**
 * The error is thrown when trying to acquire a semaphore slot, but all slots are already taken.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export class LimitReachedReaderSemaphoreError extends Error {
    static create(
        key: IKey,
        cause?: unknown,
    ): LimitReachedReaderSemaphoreError {
        return new LimitReachedReaderSemaphoreError(
            `Key "${key.get()}" has reached the limit`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `LimitReachedReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = LimitReachedReaderSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to referesh a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export class FailedRefreshReaderSemaphoreError extends Error {
    static create(
        key: IKey,
        slotId: string,
        cause?: unknown,
    ): FailedRefreshReaderSemaphoreError {
        return new FailedRefreshReaderSemaphoreError(
            `Failed to refresh slot "${slotId}" of key "${key.get()}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedRefreshReaderSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to release a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export class FailedReleaseReaderSemaphoreError extends Error {
    static create(
        key: IKey,
        slotId: string,
        cause?: unknown,
    ): FailedReleaseReaderSemaphoreError {
        return new FailedReleaseReaderSemaphoreError(
            `Failed to release slot "${slotId}" of key "${key.get()}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedReleaseReaderSemaphoreError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export const READER_SEMAPHORE_ERRORS = {
    ReachedLimit: LimitReachedReaderSemaphoreError,
    FailedRefresh: FailedRefreshReaderSemaphoreError,
    FailedRelease: FailedReleaseReaderSemaphoreError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export type AllReaderSemaphoreErrors =
    | LimitReachedReaderSemaphoreError
    | FailedRefreshReaderSemaphoreError
    | FailedReleaseReaderSemaphoreError;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export function isReaderSemaphoreError(
    value: unknown,
): value is AllReaderSemaphoreErrors {
    for (const ErrorClass of Object.values(READER_SEMAPHORE_ERRORS)) {
        if (!(value instanceof ErrorClass)) {
            return false;
        }
    }
    return true;
}

/**
 * The error is thrown when trying to acquire a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export class FailedAcquireWriterLockError extends Error {
    static create(key: IKey, cause?: unknown): FailedAcquireWriterLockError {
        return new FailedAcquireWriterLockError(
            `Key "${key.get()}" already acquired`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedAcquireWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedAcquireWriterLockError.name;
    }
}

/**
 * The error is thrown when trying to release a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export class FailedReleaseWriterLockError extends Error {
    static create(
        key: IKey,
        lockId: string,
        cause?: unknown,
    ): FailedReleaseWriterLockError {
        return new FailedReleaseWriterLockError(
            `Unonwed release on key "${key.get()}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedReleaseWriterLockError.name;
    }
}

/**
 * The error is thrown when trying to referesh a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export class FailedRefreshWriterLockError extends Error {
    static create(
        _key: IKey,
        lockId: string,
        cause?: unknown,
    ): FailedRefreshWriterLockError {
        return new FailedRefreshWriterLockError(
            `Unonwed refresh on key "${_key.get()}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedRefreshWriterLockError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export const WRITER_LOCK_ERRORS = {
    FailedAcquire: FailedAcquireWriterLockError,
    FailedRelease: FailedReleaseWriterLockError,
    FailedRefresh: FailedRefreshWriterLockError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export type AllWriterLockErrors =
    | FailedAcquireWriterLockError
    | FailedReleaseWriterLockError
    | FailedRefreshWriterLockError;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export function isWriterLockError(
    value: unknown,
): value is AllWriterLockErrors {
    for (const ErrorClass of Object.values(WRITER_LOCK_ERRORS)) {
        if (!(value instanceof ErrorClass)) {
            return false;
        }
    }
    return true;
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export const SHARED_LOCK_ERRORS = {
    ...READER_SEMAPHORE_ERRORS,
    ...WRITER_LOCK_ERRORS,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export type AllSharedLockErrors =
    | AllWriterLockErrors
    | AllReaderSemaphoreErrors;

/**
 * IMPORT_PATH: `"@daiso-tech/core/shared-lock/contracts"`
 * @group Errors
 */
export function isSharedLockError(
    value: unknown,
): value is AllSharedLockErrors {
    return isReaderSemaphoreError(value) || isWriterLockError(value);
}

/**
 * @module Lock
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type InferInstance } from "@/utilities/_module.js";

/**
 * The error is thrown when trying to acquire a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Errors
 */
export class FailedAcquireLockError extends Error {
    static create(key: IKey, cause?: unknown): FailedAcquireLockError {
        return new FailedAcquireLockError(
            `Key "${key.get()}" already acquired`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedAcquireLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedAcquireLockError.name;
    }
}

/**
 * The error is thrown when trying to release a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Errors
 */
export class FailedReleaseLockError extends Error {
    static create(
        key: IKey,
        lockId: string,
        cause?: unknown,
    ): FailedReleaseLockError {
        return new FailedReleaseLockError(
            `Unonwed release on key "${key.get()}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedReleaseLockError.name;
    }
}

/**
 * The error is thrown when trying to refresh a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Errors
 */
export class FailedRefreshLockError extends Error {
    static create(
        key: IKey,
        lockId: string,
        cause?: unknown,
    ): FailedRefreshLockError {
        return new FailedRefreshLockError(
            `Unonwed refresh on key "${key.get()}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedRefreshLockError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Errors
 */
export const LOCK_ERRORS = {
    FailedAcquire: FailedAcquireLockError,
    FailedRelease: FailedReleaseLockError,
    FailedRefresh: FailedRefreshLockError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Errors
 */
export type AllLockErrors = InferInstance<
    (typeof LOCK_ERRORS)[keyof typeof LOCK_ERRORS]
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/lock/contracts"`
 * @group Errors
 */
export function isLockError(value: unknown): value is AllLockErrors {
    for (const errorClass of Object.values(LOCK_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

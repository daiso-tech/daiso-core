/**
 * @module Resilience
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Errors
 */
export class TimeoutResilienceError extends Error {
    static create(waitTime: TimeSpan): TimeoutResilienceError {
        return new TimeoutResilienceError(
            waitTime,
            `Timeout exceeded: reached limit of ${String(waitTime.toMilliseconds())}ms`,
        );
    }

    /**
     * Note: Do not instantiate `TimeoutResilienceError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        public readonly waitTime: TimeSpan,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = TimeoutResilienceError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Errors
 */
export class RetryResilienceError extends AggregateError {
    static create(
        allErrors: Array<unknown>,
        maxAttempts: number,
    ): RetryResilienceError {
        return new RetryResilienceError(
            allErrors,
            maxAttempts,
            `Retry limit reached: Failed after ${String(maxAttempts)} attempts`,
        );
    }
    /**
     * Note: Do not instantiate `RetryResilienceError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        errors: Array<unknown>,
        public readonly maxAttempts: number,
        message: string,
    ) {
        super(errors, message);
        this.name = RetryResilienceError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Errors
 */
export class RetryIntervalResilienceError extends AggregateError {
    static create(
        allErrors: Array<unknown>,
        attempt: number,
        time: TimeSpan,
        interval: TimeSpan,
    ): RetryIntervalResilienceError {
        return new RetryIntervalResilienceError(
            allErrors,
            attempt,
            time,
            interval,
            `Retry limit reached: Failed after ${String(time.toMilliseconds())}ms (Interval: ${String(interval.toMilliseconds())}ms)`,
        );
    }

    /**
     * Note: Do not instantiate `RetryIntervalResilienceError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        errors: Array<unknown>,
        public readonly attemps: number,
        public readonly time: TimeSpan,
        public readonly interval: TimeSpan,
        message: string,
    ) {
        super(errors, message);
        this.name = RetryIntervalResilienceError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Errors
 */
export const RESILIENCE_ERRORS = {
    RetryInterval: RetryIntervalResilienceError,
    Retry: RetryResilienceError,
    Timeout: TimeoutResilienceError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Errors
 */
export type AllResilienceErrors = RetryResilienceError | TimeoutResilienceError;

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Errors
 */
export function isResilienceError(
    value: unknown,
): value is AllResilienceErrors {
    for (const ErrorClass of Object.values(RESILIENCE_ERRORS)) {
        if (value instanceof ErrorClass) {
            return true;
        }
    }
    return false;
}

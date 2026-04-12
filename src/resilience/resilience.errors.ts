/**
 * @module Resilience
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/resilience"`
 * @group Errors
 */
export class TimeoutResilienceError extends Error {
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

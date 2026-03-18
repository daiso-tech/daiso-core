/**
 * @module CircuitBreaker
 */

import { type IKey } from "@/namespace/contracts/_module.js";

/**
 * The error is thrown when circuit breaker is in open state and will not allow any attempts.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Errors
 */
export class OpenCircuitBreakerError extends Error {
    static create(key: IKey, cause?: unknown): OpenCircuitBreakerError {
        return new OpenCircuitBreakerError(
            `Circuit breaker for key "${key.get()}" is in opened state. All calls are being blocked until transitioned to half opened state.`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `OpenCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = OpenCircuitBreakerError.name;
    }
}

export class IsolatedCircuitBreakerError extends Error {
    static create(key: IKey, cause?: unknown): IsolatedCircuitBreakerError {
        return new IsolatedCircuitBreakerError(
            `Circuit breaker for key "${key.get()}" is manually isolated. All calls are being blocked until reseted.`,
            cause,
            // Circuit breaker "a" is manually isolated; all requests are being blocked.
        );
    }

    /**
     * Note: Do not instantiate `IsolatedCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = IsolatedCircuitBreakerError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Errors
 */
export const CIRCUIT_BREAKER_ERRORS = {
    Open: OpenCircuitBreakerError,
    Isolated: IsolatedCircuitBreakerError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Errors
 */
export type AllCircuitBreakerErrors = OpenCircuitBreakerError;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Errors
 */
export function isCircuitBreakerError(
    value: unknown,
): value is AllCircuitBreakerErrors {
    for (const ErrorClass of Object.values(CIRCUIT_BREAKER_ERRORS)) {
        if (!(value instanceof ErrorClass)) {
            return false;
        }
    }
    return true;
}

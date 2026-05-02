/**
 * @module RateLimiter
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type RateLimiterBlockedState } from "@/rate-limiter/contracts/rate-limiter-state.contract.js";
import { type InferInstance } from "@/utilities/_module.js";

/**
 * The error is throw when rate limiter blocks the attempts.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Errors
 */
export class BlockedRateLimiterError extends Error {
    static create(
        state: Omit<RateLimiterBlockedState, "type">,
        key: IKey,
        cause?: unknown,
    ): BlockedRateLimiterError {
        return new BlockedRateLimiterError(
            state,
            `Rate limiter for key "${key.get()}" is blocked. All calls are being blocked until wait time is reached.`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `BlockedRateLimiterError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        public readonly state: Omit<RateLimiterBlockedState, "type">,
        message?: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = BlockedRateLimiterError.name;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Errors
 */
export const RATE_LIMITER_ERRORS = {
    Blocked: BlockedRateLimiterError,
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Errors
 */
export type AllRateLimiterErrors = InferInstance<
    (typeof RATE_LIMITER_ERRORS)[keyof typeof RATE_LIMITER_ERRORS]
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Errors
 */
export function isRateLimiterError(
    value: unknown,
): value is AllRateLimiterErrors {
    for (const errorClass of Object.values(RATE_LIMITER_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

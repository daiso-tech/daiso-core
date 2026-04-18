/**
 * @module RateLimiter
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Enumerated states for rate limiter operation.
 * - BLOCKED: Rate limiter is blocking requests (quota exceeded)
 * - ALLOWED: Requests are being allowed within the configured limit
 * - EXPIRED: Rate limiter has no recorded state (initial or cleaned up)
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export const RATE_LIMITER_STATE = {
    BLOCKED: "BLOCKED",
    ALLOWED: "ALLOWED",
    EXPIRED: "EXPIRED",
} as const;

/**
 * Literal union type for rate limiter state values.
 * Ensures type-safe discrimination of rate limiter states.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterStateLiterals =
    (typeof RATE_LIMITER_STATE)[keyof typeof RATE_LIMITER_STATE];

/**
 * Represents an expired rate limiter state with no recorded metrics.
 * Occurs when the rate limiter data has expired or been cleaned up.
 * Requests are allowed to proceed with fresh quota calculation.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterExpiredState = {
    /**
     * Discriminator for the EXPIRED state.
     */
    type: (typeof RATE_LIMITER_STATE)["EXPIRED"];
};

/**
 * Represents a rate limiter state where requests are being allowed.
 * The rate limiter is tracking attempts and has remaining quota available.
 * This state includes metrics about current usage within the configured limit.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterAllowedState = {
    /**
     * Discriminator for the ALLOWED state.
     */
    type: (typeof RATE_LIMITER_STATE)["ALLOWED"];

    /**
     * Number of attempts already consumed in the current time window.
     * This represents the current usage count within the limit.
     */
    usedAttempts: number;

    /**
     * Number of attempts remaining before the rate limiter blocks further requests.
     * Calculated as (limit - usedAttempts).
     */
    remainingAttempts: number;

    /**
     * Maximum number of allowed attempts in the current time window.
     * Configured when the rate limiter was created.
     */
    limit: number;

    /**
     * Time duration until the rate limiter resets and begins a new window.
     * Attempts counter will reset after this time span elapses.
     */
    resetAfter: TimeSpan;
};

/**
 * Represents a rate limiter state where requests are being blocked.
 * The configured limit has been exceeded and the rate limiter is preventing further requests.
 * This state includes metrics about the excess and when the block will be lifted.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterBlockedState = {
    /**
     * Discriminator for the BLOCKED state.
     */
    type: (typeof RATE_LIMITER_STATE)["BLOCKED"];

    /**
     * Maximum number of allowed attempts in the current time window.
     * This is the threshold that was exceeded, triggering the blocked state.
     */
    limit: number;

    /**
     * Total number of attempts that have been made (including those over the limit).
     * Shows the full count of requests attempted before and after blocking began.
     */
    totalAttempts: number;

    /**
     * Number of attempts that exceeded the configured limit.
     * Calculated as (totalAttempts - limit), represents the overage amount.
     */
    exceedAttempts: number;

    /**
     * Time duration until the rate limiter returns to ALLOWED or EXPIRED state.
     * After this time span elapses, new requests will be allowed and counters reset.
     */
    retryAfter: TimeSpan;
};

/**
 * Discriminated union representing all possible rate limiter states.
 * The `type` property discriminates between EXPIRED, ALLOWED, and BLOCKED states.
 * Each state provides different metrics and indicates different operational conditions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterState =
    | RateLimiterExpiredState
    | RateLimiterBlockedState
    | RateLimiterAllowedState;

/**
 * @module RateLimiter
 */

import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export const RATE_LIMITER_STATE = {
    BLOCKED: "BLOCKED",
    ALLOWED: "ALLOWED",
    EXPIRED: "EXPIRED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterStateLiterals =
    (typeof RATE_LIMITER_STATE)[keyof typeof RATE_LIMITER_STATE];

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterExpiredState = {
    type: (typeof RATE_LIMITER_STATE)["EXPIRED"];
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterAllowedState = {
    type: (typeof RATE_LIMITER_STATE)["ALLOWED"];
    usedAttempts: number;
    reaminingAttemps: number;
    limit: number;
    resetAfter: TimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterBlockedState = {
    type: (typeof RATE_LIMITER_STATE)["BLOCKED"];
    limit: number;
    totalAttempts: number;
    exceedAttempts: number;
    retryAfter: TimeSpan;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterState =
    | RateLimiterExpiredState
    | RateLimiterBlockedState
    | RateLimiterAllowedState;

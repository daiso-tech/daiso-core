/**
 * @module RateLimiter
 */

import { type IRateLimiterStateMethods } from "@/rate-limiter/contracts/rate-limiter.contract.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export type RateLimiterEventBase = {
    rateLimiter: IRateLimiterStateMethods;
};

/**
 * The event is dispatched when the attempt is blocked.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export type BlockedRateLimiterEvent = RateLimiterEventBase;

/**
 * The event is dispatched when the attempt is allowed to proceed.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export type AllowedRateLimiterEvent = RateLimiterEventBase;

/**
 * The event is dispatched when rate limiter has been reseted.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export type ResetedRateLimiterEvent = RateLimiterEventBase;

/**
 * The event is dispatched when a rate limiter has tracked failure.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export type TrackedFailureRateLimiterEvent = RateLimiterEventBase & {
    error: unknown;
};

/**
 * The event is dispatched when a rate limiter has untracked failure.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export type UntrackedFailureRateLimiterEvent = RateLimiterEventBase & {
    error: unknown;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export const RATE_LIMITER_EVENTS = {
    TRACKED_FAILURE: "TRACKED_FAILURE",
    UNTRACKED_FAILURE: "UNTRACKED_FAILURE",
    BLOCKED: "BLOCKED",
    ALLOWED: "ALLOWED",
    RESETED: "RESETED",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Events
 */
export type RateLimiterEventMap = {
    [RATE_LIMITER_EVENTS.TRACKED_FAILURE]: TrackedFailureRateLimiterEvent;
    [RATE_LIMITER_EVENTS.UNTRACKED_FAILURE]: UntrackedFailureRateLimiterEvent;
    [RATE_LIMITER_EVENTS.BLOCKED]: BlockedRateLimiterEvent;
    [RATE_LIMITER_EVENTS.ALLOWED]: AllowedRateLimiterEvent;
    [RATE_LIMITER_EVENTS.RESETED]: ResetedRateLimiterEvent;
};

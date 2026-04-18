/**
 * @module RateLimiter
 */

import {
    type FixedWindowLimiterSettings,
    type SerializedFixedWindowLimiterSettings,
} from "@/rate-limiter/implementations/policies/fixed-window-limiter/_module.js";
import {
    type SlidingWindowLimiterSettings,
    type SerializedSlidingWindowLimiterSettings,
} from "@/rate-limiter/implementations/policies/sliding-window-limiter/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/policies"`
 * @group Policies
 */
export const LIMITER_POLICIES = {
    FIXED_WINDOW: "FIXED_WINDOW",
    SLIDING_WINDOW: "SLIDING_WINDOW",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/policies"`
 * @group Policies
 */
export type FixedWindowLimiterSettingsEnum = FixedWindowLimiterSettings & {
    /**
     * Discriminant identifying this as the fixed-window rate-limiter policy.
     */
    type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/policies"`
 * @group Policies
 */
export type SlidingWindowLimiterSettingsEnum = SlidingWindowLimiterSettings & {
    /**
     * Discriminant identifying this as the sliding-window rate-limiter policy.
     */
    type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
};

/**
 * @internal
 */
export type RateLimiterPolicySettingsEnum =
    | FixedWindowLimiterSettingsEnum
    | SlidingWindowLimiterSettingsEnum;

/**
 * @internal
 */
export type SerializedFixedWindowLimiterSettingsEnum =
    SerializedFixedWindowLimiterSettings & {
        type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
    };

/**
 * @internal
 */
export type SerializedSlidingWindowLimiterSettingsEnum =
    SerializedSlidingWindowLimiterSettings & {
        type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
    };

/**
 * @internal
 */
export type SerializedRateLimiterPolicySettingsEnum =
    | SerializedFixedWindowLimiterSettingsEnum
    | SerializedSlidingWindowLimiterSettingsEnum;

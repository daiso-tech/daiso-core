/**
 * @module RateLimiter
 */

import {
    resolveFixedWindowLimiterSettings,
    serializeFixedWindowLimiterSettings,
} from "@/rate-limiter/implementations/policies/fixed-window-limiter/_module.js";
import {
    resolveSlidingWindowLimiterSettings,
    serializeSlidingWindowLimiterSettings,
} from "@/rate-limiter/implementations/policies/sliding-window-limiter/_module.js";
import { LIMITER_POLICIES } from "@/rate-limiter/implementations/policies/types.js";

import type {
    RateLimiterPolicySettingsEnum,
    SerializedRateLimiterPolicySettingsEnum,
} from "@/rate-limiter/implementations/policies/types.js";

/**
 * @internal
 */
export function resolveRateLimiterPolicySettings(
    settings: RateLimiterPolicySettingsEnum,
): Required<RateLimiterPolicySettingsEnum> {
    if (settings.type === LIMITER_POLICIES.FIXED_WINDOW) {
        return {
            type: LIMITER_POLICIES.FIXED_WINDOW,
            ...resolveFixedWindowLimiterSettings(settings),
        };
    }
    return {
        type: LIMITER_POLICIES.SLIDING_WINDOW,
        ...resolveSlidingWindowLimiterSettings(settings),
    };
}

/**
 * @internal
 */
export function serializeRateLimiterPolicySettingsEnum(
    settings: RateLimiterPolicySettingsEnum,
): Required<SerializedRateLimiterPolicySettingsEnum> {
    if (settings.type === LIMITER_POLICIES.FIXED_WINDOW) {
        return {
            type: LIMITER_POLICIES.FIXED_WINDOW,
            ...serializeFixedWindowLimiterSettings(settings),
        };
    }
    return {
        type: LIMITER_POLICIES.SLIDING_WINDOW,
        ...serializeSlidingWindowLimiterSettings(settings),
    };
}

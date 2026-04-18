/**
 * @module CircuitBreaker
 */

import { type ConsecutiveBreakerSettings } from "@/circuit-breaker/implementations/policies/consecutive-breaker/_module.js";
import { type CountBreakerSettings } from "@/circuit-breaker/implementations/policies/count-breaker/_module.js";
import {
    type SamplingBreakerSettings,
    type SerializedSamplingBreakerSettings,
} from "@/circuit-breaker/implementations/policies/sampling-breaker/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export const BREAKER_POLICIES = {
    CONSECUTIVE: "CONSECUTIVE",
    COUNT: "COUNT",
    SAMPLING: "SAMPLING",
} as const;

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type ConsecutiveBreakerSettingsEnum = ConsecutiveBreakerSettings & {
    /**
     * Discriminant identifying this as the consecutive breaker policy.
     */
    type: (typeof BREAKER_POLICIES)["CONSECUTIVE"];
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type CountBreakerSettingsEnum = CountBreakerSettings & {
    /**
     * Discriminant identifying this as the count breaker policy.
     */
    type: (typeof BREAKER_POLICIES)["COUNT"];
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type SamplingBreakerSettingsEnum = SamplingBreakerSettings & {
    /**
     * Discriminant identifying this as the sampling breaker policy.
     */
    type: (typeof BREAKER_POLICIES)["SAMPLING"];
};

/**
 * @internal
 */
export type SerializedSamplingBreakerSettingsEnum =
    SerializedSamplingBreakerSettings & {
        type: (typeof BREAKER_POLICIES)["SAMPLING"];
    };
/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type CircuitBreakerPolicySettingsEnum =
    | ConsecutiveBreakerSettingsEnum
    | CountBreakerSettingsEnum
    | SamplingBreakerSettingsEnum;

/**
 * @internal
 */
export type SerializedCircuitBreakerPolicySettingsEnum =
    | ConsecutiveBreakerSettingsEnum
    | CountBreakerSettingsEnum
    | SerializedSamplingBreakerSettingsEnum;

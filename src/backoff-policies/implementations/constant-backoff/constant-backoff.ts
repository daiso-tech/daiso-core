/**
 * @module BackoffPolicy
 */

import { TO_MILLISECONDS } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvocable, isInvocable, withJitter } from "@/utilities/_module.js";

import type {
    BackoffPolicy,
    DynamicBackoffPolicy,
} from "@/backoff-policies/contracts/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * Configuration for the constant backoff policy.
 * Each retry waits for the same fixed `delay`, optionally randomised by a jitter
 * factor to spread out thundering-herd retries across multiple clients.
 *
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
 * @group Implementations
 */
export type ConstantBackoffSettings = {
    /**
     * Fixed wait duration applied between every retry attempt.
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromSeconds(1)
     * ```
     */
    delay?: ITimeSpan;

    /**
     * Adds randomness to the delay to avoid thundering-herd effects.
     * Set to `null` to disable jitter.
     * @default 0.5
     */
    jitter?: number | null;

    /**
     * @internal
     * Should only be used for testing
     */
    internalMathRandom?: () => number;
};

/**
 * @internal
 */
export function resolveConstantBackoffSettings(
    settings: ConstantBackoffSettings,
): Required<ConstantBackoffSettings> {
    const {
        delay = TimeSpan.fromSeconds(1),
        jitter = 0.5,
        internalMathRandom = Math.random,
    } = settings;

    if (!(delay[TO_MILLISECONDS]() > 0)) {
        throw new TypeError("'delay' must be positive");
    }
    if (jitter !== null && !(jitter >= 0 && jitter <= 1)) {
        throw new TypeError("'jitter' must be between 0 and 1 or null");
    }

    return {
        delay,
        jitter,
        internalMathRandom,
    };
}

/**
 * Constant backoff policy with jitter
 *
 * IMPORT_PATH: `"eridu-tech/backoff-policies"`
 * @group Implementations
 */
export function constantBackoff(
    settings: DynamicBackoffPolicy<ConstantBackoffSettings> = {},
): BackoffPolicy {
    return (_attempt, error) => {
        if (isInvocable(settings)) {
            const dynamicSettings = callInvocable(settings, error);
            if (dynamicSettings === undefined) {
                settings = {};
            } else {
                settings = dynamicSettings;
            }
        }
        const { delay, jitter, internalMathRandom } =
            resolveConstantBackoffSettings(settings);
        return TimeSpan.fromMilliseconds(
            withJitter({
                jitter,
                value: delay[TO_MILLISECONDS](),
                randomValue: internalMathRandom(),
            }),
        );
    };
}

/**
 * @internal
 */
export type SerializedConstantBackoffSettings = {
    delay?: number;

    jitter?: number | null;

    internalMathRandom?: number;
};

/**
 * @internal
 */
export function serializeConstantBackoffSettings(
    settings: ConstantBackoffSettings,
): Required<SerializedConstantBackoffSettings> {
    const { delay, jitter, internalMathRandom } =
        resolveConstantBackoffSettings(settings);
    return {
        delay: delay[TO_MILLISECONDS](),
        jitter,
        internalMathRandom: internalMathRandom(),
    };
}

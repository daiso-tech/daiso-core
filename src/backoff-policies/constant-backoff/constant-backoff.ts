/**
 * @module BackoffPolicy
 */

import {
    type BackoffPolicy,
    type DynamicBackoffPolicy,
} from "@/backoff-policies/_shared.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable, isInvokable, withJitter } from "@/utilities/_module.js";

/**
 * Configuration for the constant backoff policy.
 * Each retry waits for the same fixed `delay`, optionally randomised by a jitter
 * factor to spread out thundering-herd retries across multiple clients.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 */
export type ConstantBackoffSettings = {
    /**
     * Fixed wait duration applied between every retry attempt.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
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
    _mathRandom?: () => number;
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
        _mathRandom = Math.random,
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
        _mathRandom,
    };
}

/**
 * Constant backoff policy with jitter
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 */
export function constantBackoff(
    settings: DynamicBackoffPolicy<ConstantBackoffSettings> = {},
): BackoffPolicy {
    return (_attempt, error) => {
        if (isInvokable(settings)) {
            const dynamicSettings = callInvokable(settings, error);
            if (dynamicSettings === undefined) {
                settings = {};
            } else {
                settings = dynamicSettings;
            }
        }
        const { delay, jitter, _mathRandom } =
            resolveConstantBackoffSettings(settings);
        return TimeSpan.fromMilliseconds(
            withJitter({
                jitter,
                value: delay[TO_MILLISECONDS](),
                randomValue: _mathRandom(),
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

    _mathRandom?: number;
};

/**
 * @internal
 */
export function serializeConstantBackoffSettings(
    settings: ConstantBackoffSettings,
): Required<SerializedConstantBackoffSettings> {
    const { delay, jitter, _mathRandom } =
        resolveConstantBackoffSettings(settings);
    return {
        delay: delay[TO_MILLISECONDS](),
        jitter,
        _mathRandom: _mathRandom(),
    };
}

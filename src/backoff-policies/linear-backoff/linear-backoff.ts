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
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 */
export type LinearBackoffSettings = {
    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(6)
     * ```
     */
    maxDelay?: ITimeSpan;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(1)
     * ```
     */
    minDelay?: ITimeSpan;

    /**
     * You can pass jitter value to ensure the backoff will not execute at the same time.
     * If you pas null you can disable the jitrter.
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
export function resolveLinearBackoffSettings(
    settings: LinearBackoffSettings,
): Required<LinearBackoffSettings> {
    const {
        maxDelay = TimeSpan.fromMilliseconds(6000),
        minDelay = TimeSpan.fromMilliseconds(1_000),
        jitter = 0.5,
        _mathRandom = Math.random,
    } = settings;

    return {
        maxDelay,
        minDelay,
        jitter,
        _mathRandom,
    };
}

/**
 * Linear backoff policy with jitter
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 */
export function linearBackoff(
    settings: DynamicBackoffPolicy<LinearBackoffSettings> = {},
): BackoffPolicy {
    return (attempt, error) => {
        if (isInvokable(settings)) {
            const dynamicSettings = callInvokable(settings, error);
            if (dynamicSettings === undefined) {
                settings = {};
            } else {
                settings = dynamicSettings;
            }
        }
        const { maxDelay, minDelay, jitter, _mathRandom } =
            resolveLinearBackoffSettings(settings);
        const linear = Math.min(
            maxDelay[TO_MILLISECONDS](),
            minDelay[TO_MILLISECONDS]() * attempt,
        );
        return TimeSpan.fromMilliseconds(
            withJitter({
                jitter,
                value: linear,
                randomValue: _mathRandom(),
            }),
        );
    };
}

/**
 * @internal
 */
export type SerializedLinearBackoffSettings = {
    maxDelay?: number;

    minDelay?: number;

    jitter?: number | null;

    _mathRandom?: number;
};

/**
 * @internal
 */
export function serializeLinearBackoffSettings(
    settings: LinearBackoffSettings,
): Required<SerializedLinearBackoffSettings> {
    const { maxDelay, minDelay, jitter, _mathRandom } =
        resolveLinearBackoffSettings(settings);

    return {
        maxDelay: maxDelay[TO_MILLISECONDS](),
        minDelay: minDelay[TO_MILLISECONDS](),
        jitter,
        _mathRandom: _mathRandom(),
    };
}

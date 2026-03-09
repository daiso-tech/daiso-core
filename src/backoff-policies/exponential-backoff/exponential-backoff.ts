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
export type ExponentialBackoffSettings = {
    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(60)
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
     * @default 2
     */
    multiplier?: number;

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
export function resolveExponentialBackoffSettings(
    settings: ExponentialBackoffSettings,
): Required<ExponentialBackoffSettings> {
    const {
        maxDelay = TimeSpan.fromMilliseconds(60_000),
        minDelay = TimeSpan.fromMilliseconds(1_000),
        multiplier = 2,
        jitter = 0.5,
        _mathRandom = Math.random,
    } = settings;

    return {
        maxDelay,
        minDelay,
        multiplier,
        jitter,
        _mathRandom,
    };
}

/**
 * Exponential backoff policy with jitter
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 */
export function exponentialBackoff(
    settings: DynamicBackoffPolicy<ExponentialBackoffSettings> = {},
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
        const { jitter, _mathRandom, multiplier, maxDelay, minDelay } =
            resolveExponentialBackoffSettings(settings);

        const exponential = Math.min(
            maxDelay[TO_MILLISECONDS](),
            minDelay[TO_MILLISECONDS]() * Math.pow(multiplier, attempt),
        );
        return TimeSpan.fromMilliseconds(
            withJitter({
                jitter,
                value: exponential,
                randomValue: _mathRandom(),
            }),
        );
    };
}

/**
 * @internal
 */
export type SerializedExponentialBackoffSettings = {
    maxDelay?: number;

    minDelay?: number;

    multiplier?: number;

    jitter?: number | null;

    _mathRandom?: number;
};

/**
 * @internal
 */
export function serializeExponentialBackoffSettings(
    settings: ExponentialBackoffSettings,
): Required<SerializedExponentialBackoffSettings> {
    const { maxDelay, minDelay, multiplier, jitter, _mathRandom } =
        resolveExponentialBackoffSettings(settings);
    return {
        maxDelay: maxDelay[TO_MILLISECONDS](),
        minDelay: minDelay[TO_MILLISECONDS](),
        multiplier,
        jitter,
        _mathRandom: _mathRandom(),
    };
}

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
 * Configuration for the polynomial backoff policy.
 * The wait time grows as `minDelay * attempt^degree`, clamped to `maxDelay`.
 * An optional `jitter` factor randomises the delay to reduce retry collisions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 */
export type PolynomialBackoffSettings = {
    /**
     * Upper bound on the computed delay. The wait time will never exceed this value.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromSeconds(60)
     * ```
     */
    maxDelay?: ITimeSpan;

    /**
     * Starting delay for the first retry. Subsequent delays grow from this base.
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMilliseconds(500)
     * ```
     */
    minDelay?: ITimeSpan;

    /**
     * The exponent of the polynomial used to calculate the delay: `minDelay * attempt^degree`.
     * Higher values produce faster growth in wait times.
     * @default 2
     */
    degree?: number;

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
export function resolvePolynomialBackoffSettings(
    settings: PolynomialBackoffSettings,
): Required<PolynomialBackoffSettings> {
    const {
        maxDelay = TimeSpan.fromSeconds(60),
        minDelay = TimeSpan.fromMilliseconds(500),
        degree = 2,
        jitter = 0.5,
        _mathRandom = Math.random,
    } = settings;

    if (!(minDelay[TO_MILLISECONDS]() > 0)) {
        throw new TypeError("'minDelay' must be positive");
    }
    if (!(maxDelay[TO_MILLISECONDS]() >= minDelay[TO_MILLISECONDS]())) {
        throw new TypeError(
            "'maxDelay' must be greater than or equal to 'minDelay'",
        );
    }
    if (!(degree > 0)) {
        throw new TypeError("'degree' must be positive");
    }
    if (jitter !== null && !(jitter >= 0 && jitter <= 1)) {
        throw new TypeError("'jitter' must be between 0 and 1 or null");
    }

    return {
        maxDelay,
        minDelay,
        degree,
        jitter,
        _mathRandom,
    };
}

/**
 * Polynomial backoff policy with jitter
 *
 * IMPORT_PATH: `"@daiso-tech/core/backoff-policies"`
 */
export function polynomialBackoff(
    settings: DynamicBackoffPolicy<PolynomialBackoffSettings> = {},
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
        const { maxDelay, minDelay, degree, jitter, _mathRandom } =
            resolvePolynomialBackoffSettings(settings);
        const polynomial = Math.min(
            maxDelay[TO_MILLISECONDS](),
            minDelay[TO_MILLISECONDS]() * Math.pow(attempt, degree),
        );
        return TimeSpan.fromMilliseconds(
            withJitter({
                jitter,
                value: polynomial,
                randomValue: _mathRandom(),
            }),
        );
    };
}

/**
 * @internal
 */
export type SerializedPolynomialBackoffSettings = {
    maxDelay?: number;

    minDelay?: number;

    degree?: number;

    jitter?: number | null;

    _mathRandom?: number;
};

/**
 * @internal
 */
export function serializePolynomialBackoffSettings(
    settings: PolynomialBackoffSettings,
): Required<SerializedPolynomialBackoffSettings> {
    const { maxDelay, minDelay, degree, jitter, _mathRandom } =
        resolvePolynomialBackoffSettings(settings);
    return {
        maxDelay: maxDelay[TO_MILLISECONDS](),
        minDelay: minDelay[TO_MILLISECONDS](),
        degree,
        jitter,
        _mathRandom: _mathRandom(),
    };
}

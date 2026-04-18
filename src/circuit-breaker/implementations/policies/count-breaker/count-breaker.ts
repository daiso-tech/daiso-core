/**
 * @module CircuitBreaker
 */

import {
    HALF_OPEN_TRANSITIONS,
    type HalfOpenTransitions,
    type CircuitBreakerTrackSettings,
    type CircuitBreakerTrackState,
    type ICircuitBreakerPolicy,
    CLOSED_TRANSITIONS,
    type ClosedTransitions,
} from "@/circuit-breaker/contracts/_module.js";

/**
 * Configuration for the count-based sliding-window circuit breaker policy.
 * Tracks requests over a fixed-size window and opens the circuit when the failure
 * percentage exceeds `failureThreshold`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type CountBreakerSettings = {
    /**
     * Percentage (from 0 to 1) failures before going from closed -> open.
     *
     * @default 0.2
     */
    failureThreshold?: number;

    /**
     * Percentage (from 0 to 1) successes before going from half-open -> closed.
     *
     * @default
     * ```ts
     * 1 - settings.failureThreshold
     * ```
     */
    successThreshold?: number;

    /**
     * Size of the count based sliding window.
     *
     * @default 20
     */
    size?: number;

    /**
     * The minimum number of calls to go from closed -> open, half-opened -> closed or half-opened -> open.
     *
     * @default
     * ```ts
     * settings.size
     * ```
     */
    minimumNumberOfCalls?: number;
};

/**
 * @internal
 */
export function resolveCountBreakerSettings(
    settings: CountBreakerSettings,
): Required<CountBreakerSettings> {
    const {
        failureThreshold = 0.2,
        successThreshold = 1 - failureThreshold,
        size = 20,
        minimumNumberOfCalls = size,
    } = settings;

    if (Number.isInteger(failureThreshold)) {
        throw new TypeError(
            `"CountBreakerSettings.failureThreshold" should be a float, got integer instead`,
        );
    }
    if (failureThreshold <= 0 || failureThreshold >= 1) {
        throw new RangeError(
            `"CountBreakerSettings.failureThreshold" should be between 0 and 1, got ${String(failureThreshold)}`,
        );
    }
    if (Number.isInteger(successThreshold)) {
        throw new TypeError(
            `"CountBreakerSettings.successThreshold" should be a float, got integer instead`,
        );
    }
    if (successThreshold <= 0 || successThreshold >= 1) {
        throw new RangeError(
            `"CountBreakerSettings.successThreshold" should be between 0 and 1, got ${String(successThreshold)}`,
        );
    }
    if (!Number.isSafeInteger(size)) {
        throw new TypeError(
            `"CountBreakerSettings.size" should be an integer, got float instead`,
        );
    }
    if (size < 1) {
        throw new RangeError(
            `"CountBreakerSettings.size" should be a positive, got ${String(size)}`,
        );
    }
    if (!Number.isSafeInteger(minimumNumberOfCalls)) {
        throw new TypeError(
            `"CountBreakerSettings.minimumNumberOfCalls" should be an integer, got float instead`,
        );
    }
    if (minimumNumberOfCalls < 1 || minimumNumberOfCalls > size) {
        throw new RangeError(
            `"CountBreakerSettings.minimumNumberOfCalls" should be between 1, and "CountBreakerSettings.size" (which is ${String(size)}), got ${String(minimumNumberOfCalls)}`,
        );
    }

    return {
        failureThreshold,
        successThreshold,
        size,
        minimumNumberOfCalls,
    };
}

/**
 * In-memory sample window used by the count-based circuit breaker.
 * Each boolean entry represents whether a single call succeeded (`true`) or failed (`false`).
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type CountBreakerState = {
    samples: Array<boolean>;
};

/**
 * The `CountBreaker` breaks after a proportion of requests in a count based sliding window fail.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export class CountBreaker implements ICircuitBreakerPolicy<CountBreakerState> {
    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly minimumNumberOfCalls: number;
    private readonly size: number;

    constructor(settings: CountBreakerSettings = {}) {
        const {
            failureThreshold,
            successThreshold,
            size,
            minimumNumberOfCalls,
        } = resolveCountBreakerSettings(settings);

        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
        this.minimumNumberOfCalls = minimumNumberOfCalls;
        this.size = size;
    }

    initialMetrics(): CountBreakerState {
        return {
            samples: [],
        };
    }

    private static failureCount(currentMetrics: CountBreakerState): number {
        let count = 0;
        for (const isSuccess of currentMetrics.samples) {
            if (!isSuccess) {
                count++;
            }
        }
        return count;
    }

    private static successCount(currentMetrics: CountBreakerState): number {
        let count = 0;
        for (const isSuccess of currentMetrics.samples) {
            if (isSuccess) {
                count++;
            }
        }
        return count;
    }

    private isMinimumNotMet(currentMetrics: CountBreakerState): boolean {
        return currentMetrics.samples.length <= this.minimumNumberOfCalls;
    }

    whenClosed(
        currentMetrics: CountBreakerState,
        _currentDate: Date,
    ): ClosedTransitions {
        if (this.isMinimumNotMet(currentMetrics)) {
            return CLOSED_TRANSITIONS.NONE;
        }

        const allowedFailureCount = Math.ceil(
            this.failureThreshold * currentMetrics.samples.length,
        );

        const hasFailed =
            CountBreaker.failureCount(currentMetrics) > allowedFailureCount;
        if (hasFailed) {
            return CLOSED_TRANSITIONS.TO_OPEN;
        }

        return CLOSED_TRANSITIONS.NONE;
    }

    whenHalfOpened(
        currentMetrics: CountBreakerState,
        _currentDate: Date,
    ): HalfOpenTransitions {
        if (this.isMinimumNotMet(currentMetrics)) {
            return CLOSED_TRANSITIONS.NONE;
        }

        const allowedSuccessCount = Math.ceil(
            this.successThreshold * currentMetrics.samples.length,
        );
        const hasSucceeded =
            CountBreaker.successCount(currentMetrics) >= allowedSuccessCount;
        if (hasSucceeded) {
            return HALF_OPEN_TRANSITIONS.TO_CLOSED;
        }
        return HALF_OPEN_TRANSITIONS.TO_OPEN;
    }

    private track(
        success: boolean,
        currentState: CircuitBreakerTrackState<CountBreakerState>,
    ): CountBreakerState {
        let newSamples = [...currentState.metrics.samples, success];
        if (currentState.metrics.samples.length >= this.size) {
            newSamples = newSamples.slice(1);
        }
        return {
            samples: newSamples,
        };
    }

    trackFailure(
        currentState: CircuitBreakerTrackState<CountBreakerState>,
        _settings: CircuitBreakerTrackSettings<CountBreakerState>,
    ): CountBreakerState {
        return this.track(false, currentState);
    }

    trackSuccess(
        currentState: CircuitBreakerTrackState<CountBreakerState>,
        _settings: CircuitBreakerTrackSettings<CountBreakerState>,
    ): CountBreakerState {
        return this.track(true, currentState);
    }

    isEqual(metricsA: CountBreakerState, metricsB: CountBreakerState): boolean {
        const failureCountA = metricsA.samples.filter(
            (isSuccess) => !isSuccess,
        ).length;
        const failureCountB = metricsB.samples.filter(
            (isSuccess) => !isSuccess,
        ).length;
        const successCountA = metricsA.samples.filter(
            (isSuccess) => isSuccess,
        ).length;
        const successCountB = metricsB.samples.filter(
            (isSuccess) => isSuccess,
        ).length;
        return (
            failureCountA === failureCountB && successCountA === successCountB
        );
    }
}

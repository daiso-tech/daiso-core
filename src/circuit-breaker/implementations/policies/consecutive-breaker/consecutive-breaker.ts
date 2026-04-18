/**
 * @module CircuitBreaker
 */

import {
    type HalfOpenTransitions,
    type CircuitBreakerTrackSettings,
    type CircuitBreakerTrackState,
    type ICircuitBreakerPolicy,
    type ClosedTransitions,
    CIRCUIT_BREAKER_STATE,
    HALF_OPEN_TRANSITIONS,
    CLOSED_TRANSITIONS,
} from "@/circuit-breaker/contracts/_module.js";

/**
 * Tracks in-memory failure and success counts for the consecutive circuit breaker.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type ConsecutiveBreakerState = {
    failureCount: number;
    successCount: number;
};

/**
 * Configuration for the consecutive-failures circuit breaker policy.
 * Opens the circuit when `failureThreshold` consecutive failures occur,
 * and closes it again after `successThreshold` consecutive successes in half-open state.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type ConsecutiveBreakerSettings = {
    /**
     * Amount of consecutive failures before going from closed -> open.
     *
     * @default 5
     */
    failureThreshold?: number;

    /**
     * Amount of consecutive success before going from half-open -> closed.
     *
     * @default settings.failureThreshold
     */
    successThreshold?: number;
};

/**
 * @internal
 */
export function resolveConsecutiveBreakerSettings(
    settings: ConsecutiveBreakerSettings,
): Required<ConsecutiveBreakerSettings> {
    const { failureThreshold = 5, successThreshold = failureThreshold } =
        settings;
    if (!Number.isSafeInteger(failureThreshold)) {
        throw new TypeError(
            `"ConsecutiveBreakerSettings.failureThreshold" should be an integer, got float instead`,
        );
    }
    if (failureThreshold < 1) {
        throw new RangeError(
            `"ConsecutiveBreakerSettings.failureThreshold" should be a positive, got ${String(failureThreshold)}`,
        );
    }
    if (!Number.isSafeInteger(successThreshold)) {
        throw new TypeError(
            `"ConsecutiveBreakerSettings.successThreshold" should be an integer, got float instead`,
        );
    }
    if (successThreshold < 1) {
        throw new RangeError(
            `"ConsecutiveBreakerSettings.successThreshold" should be a positive, got ${String(successThreshold)}`,
        );
    }
    return {
        failureThreshold,
        successThreshold,
    };
}

/**
 * The `ConsecutiveBreaker` breaks after n requests in a row fail.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export class ConsecutiveBreaker
    implements ICircuitBreakerPolicy<ConsecutiveBreakerState>
{
    private readonly failureThreshold: number;
    private readonly successThreshold: number;

    constructor(settings: ConsecutiveBreakerSettings = {}) {
        const { failureThreshold, successThreshold } =
            resolveConsecutiveBreakerSettings(settings);
        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
    }

    initialMetrics(): ConsecutiveBreakerState {
        return {
            failureCount: 0,
            successCount: 0,
        };
    }

    whenClosed(
        currentMetrics: ConsecutiveBreakerState,
        _currentDate: Date,
    ): ClosedTransitions {
        const hasFailed = currentMetrics.failureCount >= this.failureThreshold;
        if (hasFailed) {
            return CLOSED_TRANSITIONS.TO_OPEN;
        }
        return CLOSED_TRANSITIONS.NONE;
    }

    whenHalfOpened(
        currentMetrics: ConsecutiveBreakerState,
        _currentDate: Date,
    ): HalfOpenTransitions {
        const hasFailed = currentMetrics.failureCount > 0;
        if (hasFailed) {
            return HALF_OPEN_TRANSITIONS.TO_OPEN;
        }
        const hasSucceeded =
            currentMetrics.successCount >= this.successThreshold;
        if (hasSucceeded) {
            return HALF_OPEN_TRANSITIONS.TO_CLOSED;
        }
        return HALF_OPEN_TRANSITIONS.NONE;
    }

    trackFailure(
        currentState: CircuitBreakerTrackState<ConsecutiveBreakerState>,
        _settings: CircuitBreakerTrackSettings<ConsecutiveBreakerState>,
    ): ConsecutiveBreakerState {
        return {
            failureCount: currentState.metrics.failureCount + 1,
            successCount: currentState.metrics.successCount,
        };
    }

    trackSuccess(
        currentState: CircuitBreakerTrackState<ConsecutiveBreakerState>,
        settings: CircuitBreakerTrackSettings<ConsecutiveBreakerState>,
    ): ConsecutiveBreakerState {
        if (currentState.type === CIRCUIT_BREAKER_STATE.CLOSED) {
            return settings.initialMetrics;
        }

        return {
            failureCount: currentState.metrics.failureCount,
            successCount: currentState.metrics.successCount + 1,
        };
    }

    isEqual(
        metricsA: ConsecutiveBreakerState,
        metricsB: ConsecutiveBreakerState,
    ): boolean {
        return (
            metricsA.failureCount === metricsB.failureCount &&
            metricsA.successCount === metricsB.successCount
        );
    }
}

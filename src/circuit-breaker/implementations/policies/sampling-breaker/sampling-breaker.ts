/**
 * @module CircuitBreaker
 */

import {
    type HalfOpenTransitions,
    type CircuitBreakerTrackSettings,
    type CircuitBreakerTrackState,
    type ICircuitBreakerPolicy,
    type ClosedTransitions,
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
} from "@/circuit-breaker/contracts/_module.js";
import {
    TO_MILLISECONDS,
    type ITimeSpan,
} from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Configuration for the time-based sampling circuit breaker policy.
 * Tracks requests over a sliding time window and opens the circuit when the failure
 * percentage exceeds `failureThreshold`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type SamplingBreakerSettings = {
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
     * Length of time over which to sample.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromMinutes(1)
     * ```
     */
    timeSpan?: ITimeSpan;

    /**
     * The sample length time.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span";
     *
     * TimeSpan.fromTimeSpan(settings.timeSpan).divide(6)
     * ```
     */
    sampleTimeSpan?: ITimeSpan;

    /**
     * The minimum number of calls per seconds to go from closed -> open, half-opened -> closed or half-opened -> open.
     *
     * @default 5
     */
    minimumRps?: number;
};

/**
 * @internal
 */
export function resolveSamplingBreakerSettings(
    settings: SamplingBreakerSettings,
): Required<SamplingBreakerSettings> {
    const {
        failureThreshold = 0.2,
        successThreshold = 1 - failureThreshold,
        timeSpan = TimeSpan.fromMinutes(1),
        sampleTimeSpan = TimeSpan.fromTimeSpan(timeSpan).divide(6),
        minimumRps = 10,
    } = settings;

    if (Number.isInteger(failureThreshold)) {
        throw new TypeError(
            `"SamplingBreakerSettings.failureThreshold" should be a float, got integer instead`,
        );
    }
    if (failureThreshold <= 0 || failureThreshold >= 1) {
        throw new RangeError(
            `"SamplingBreakerSettings.failureThreshold" should be between 0 and 1, got ${String(failureThreshold)}`,
        );
    }

    if (Number.isInteger(successThreshold)) {
        throw new TypeError(
            `"SamplingBreakerSettings.successThreshold" should be a float, got integer instead`,
        );
    }
    if (successThreshold <= 0 || successThreshold >= 1) {
        throw new RangeError(
            `"SamplingBreakerSettings.successThreshold" should be between 0 and 1, got ${String(successThreshold)}`,
        );
    }

    return {
        failureThreshold,
        successThreshold,
        timeSpan,
        sampleTimeSpan,
        minimumRps,
    };
}

/**
 * @internal
 */
export type SerializedSamplingBreakerSettings = {
    failureThreshold?: number;
    successThreshold?: number;
    timeSpan?: number;
    sampleTimeSpan?: number;
    minimumRps?: number;
};

/**
 * @internal
 */
export function serializeSamplingBreakerSettings(
    settings: SamplingBreakerSettings,
): Required<SerializedSamplingBreakerSettings> {
    const {
        failureThreshold,
        successThreshold,
        timeSpan,
        sampleTimeSpan,
        minimumRps,
    } = resolveSamplingBreakerSettings(settings);
    return {
        failureThreshold,
        successThreshold,
        timeSpan: timeSpan[TO_MILLISECONDS](),
        sampleTimeSpan: sampleTimeSpan[TO_MILLISECONDS](),
        minimumRps,
    };
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type Sample = {
    startedAt: number;
    failures: number;
    successes: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export type SamplingBreakerState = {
    samples: Array<Sample>;
};

/**
 * @internal
 */
type ProccesedMetricData = {
    total: number;
    totalFailures: number;
    totalSuccesses: number;
};

/**
 * The `SamplingBreaker` breaks after a proportion of requests over a time period fail.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/policies"`
 * @group Policies
 */
export class SamplingBreaker
    implements ICircuitBreakerPolicy<SamplingBreakerState>
{
    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly timeSpan: TimeSpan;
    private readonly sampleTimeSpan: TimeSpan;
    private readonly minimumRps: number;

    constructor(settings: SamplingBreakerSettings = {}) {
        const {
            failureThreshold,
            successThreshold,
            timeSpan,
            sampleTimeSpan,
            minimumRps,
        } = resolveSamplingBreakerSettings(settings);

        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
        this.timeSpan = TimeSpan.fromTimeSpan(timeSpan);
        this.sampleTimeSpan = TimeSpan.fromTimeSpan(sampleTimeSpan);
        this.minimumRps = minimumRps;
    }

    initialMetrics(): SamplingBreakerState {
        return {
            samples: [],
        };
    }

    private static getProccesedMetricData(
        currentMetrics: SamplingBreakerState,
    ): ProccesedMetricData {
        let totalFailures = 0;
        let totalSuccesses = 0;
        for (const sample of currentMetrics.samples) {
            totalFailures += sample.failures;
            totalSuccesses += sample.successes;
        }
        const total = totalFailures + totalSuccesses;
        return {
            total,
            totalFailures,
            totalSuccesses,
        };
    }

    private isMiniumNotMet(total: number): boolean {
        return total < Math.ceil(this.timeSpan.toSeconds() * this.minimumRps);
    }

    whenClosed(
        currentMetrics: SamplingBreakerState,
        _currentDate: Date,
    ): ClosedTransitions {
        const { total, totalFailures } =
            SamplingBreaker.getProccesedMetricData(currentMetrics);

        if (this.isMiniumNotMet(total)) {
            return CLOSED_TRANSITIONS.NONE;
        }

        const failureCount = Math.ceil(this.failureThreshold * total);
        const hasFailed = totalFailures > failureCount;
        if (hasFailed) {
            return CLOSED_TRANSITIONS.TO_OPEN;
        }

        return CLOSED_TRANSITIONS.NONE;
    }

    whenHalfOpened(
        currentMetrics: SamplingBreakerState,
        _currentDate: Date,
    ): HalfOpenTransitions {
        const { total, totalSuccesses } =
            SamplingBreaker.getProccesedMetricData(currentMetrics);

        if (this.isMiniumNotMet(total)) {
            return HALF_OPEN_TRANSITIONS.NONE;
        }

        const successCount = Math.ceil(this.successThreshold * total);
        const hasSucceeded = totalSuccesses > successCount;
        if (hasSucceeded) {
            return HALF_OPEN_TRANSITIONS.TO_CLOSED;
        }
        return HALF_OPEN_TRANSITIONS.TO_OPEN;
    }

    private isNotOverlapping(currentDate: Date) {
        return (sample: Sample): boolean => {
            const windowStart = this.timeSpan.toStartDate(currentDate);
            const sampleEnd = this.sampleTimeSpan.toEndDate(
                new Date(sample.startedAt),
            );
            return sampleEnd < windowStart;
        };
    }

    private track(
        success: boolean,
        currentState: CircuitBreakerTrackState<SamplingBreakerState>,
        settings: CircuitBreakerTrackSettings<SamplingBreakerState>,
    ): SamplingBreakerState {
        let samples = [...currentState.metrics.samples].filter(
            this.isNotOverlapping(settings.currentDate),
        );

        let currentSample: Sample = samples.at(-1) ?? {
            failures: 0,
            successes: 0,
            startedAt: settings.currentDate.getTime(),
        };

        const currentSampleEnd = this.sampleTimeSpan
            .toEndDate(settings.currentDate)
            .getTime();
        const hasCurrentSampleEnded =
            currentSampleEnd < settings.currentDate.getTime();
        if (hasCurrentSampleEnded) {
            currentSample = {
                failures: 0,
                successes: 0,
                startedAt: settings.currentDate.getTime(),
            };
            samples = [...samples, currentSample];
        }

        if (success) {
            currentSample.successes++;
        } else {
            currentSample.failures++;
        }

        return {
            samples,
        };
    }

    trackFailure(
        currentState: CircuitBreakerTrackState<SamplingBreakerState>,
        settings: CircuitBreakerTrackSettings<SamplingBreakerState>,
    ): SamplingBreakerState {
        return this.track(false, currentState, settings);
    }

    trackSuccess(
        currentState: CircuitBreakerTrackState<SamplingBreakerState>,
        settings: CircuitBreakerTrackSettings<SamplingBreakerState>,
    ): SamplingBreakerState {
        return this.track(true, currentState, settings);
    }

    isEqual(
        metricsA: SamplingBreakerState,
        metricsB: SamplingBreakerState,
    ): boolean {
        const sortedMetricsA = [...metricsA.samples].sort(
            (metrics1, metrics2) =>
                metrics1.startedAt > metrics2.startedAt ? 1 : -1,
        );
        const sortedMetricsB = [...metricsB.samples].sort(
            (metrics1, metrics2) =>
                metrics1.startedAt > metrics2.startedAt ? 1 : -1,
        );
        return (
            JSON.stringify(sortedMetricsA) === JSON.stringify(sortedMetricsB)
        );
    }
}

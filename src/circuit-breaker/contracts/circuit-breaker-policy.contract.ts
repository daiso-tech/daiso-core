/**
 * @module CircuitBreaker
 */

import { type CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/circuit-breaker-state.contract.js";

/**
 * Represents circuit breaker metrics during HALF_OPEN state.
 * Tracks diagnostic data for determining if the service has recovered.
 *
 * @template TMetrics - The type of metrics being tracked
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerHalfOpenState<TMetrics = unknown> = {
    /**
     * The current state type indicator.
     */
    type: typeof CIRCUIT_BREAKER_STATE.HALF_OPEN;

    /**
     * Accumulated metrics from the half-open testing period.
     */
    metrics: TMetrics;
};

/**
 * Represents circuit breaker metrics during CLOSED state.
 * Tracks performance data for determining if failures warrant opening the circuit.
 *
 * @template TMetrics - The type of metrics being tracked
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerClosedState<TMetrics = unknown> = {
    /**
     * The current state type indicator.
     */
    type: typeof CIRCUIT_BREAKER_STATE.CLOSED;

    /**
     * Accumulated metrics tracking failures, successes, and slow calls.
     */
    metrics: TMetrics;
};

/**
 * Union of trackable circuit breaker states (CLOSED and HALF_OPEN).
 * Represents states where metrics are actively being accumulated.
 *
 * @template TMetrics - The type of metrics being tracked
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerTrackState<TMetrics = unknown> =
    | CircuitBreakerClosedState<TMetrics>
    | CircuitBreakerHalfOpenState<TMetrics>;

/**
 * Enumerated state transitions when circuit breaker is in CLOSED state.
 * Determines whether to transition to OPEN or remain CLOSED.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export const CLOSED_TRANSITIONS = {
    /**
     * Transition from CLOSED to OPEN state based on failure/slowness detection.
     */
    TO_OPEN: "TO_OPEN",

    /**
     * Remain in CLOSED state; no transition needed.
     */
    NONE: "NONE",
} as const;

/**
 * Union type of all possible state transitions when in CLOSED state.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ClosedTransitions =
    (typeof CLOSED_TRANSITIONS)[keyof typeof CLOSED_TRANSITIONS];

/**
 * Enumerated state transitions when circuit breaker is in HALF_OPEN state.
 * Determines recovery (transition to CLOSED), continued failure (transition to OPEN), or hold (remain HALF_OPEN).
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export const HALF_OPEN_TRANSITIONS = {
    /**
     * Return to OPEN state if recovery failed.
     */
    TO_OPEN: "TO_OPEN",

    /**
     * Transition to CLOSED state if recovery succeeded.
     */
    TO_CLOSED: "TO_CLOSED",

    /**
     * Remain in HALF_OPEN state; continue testing.
     */
    NONE: "NONE",
} as const;

/**
 * Union type of all possible state transitions when in HALF_OPEN state.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type HalfOpenTransitions =
    (typeof HALF_OPEN_TRANSITIONS)[keyof typeof HALF_OPEN_TRANSITIONS];

/**
 * Initial settings for circuit breaker tracking configuration.
 *
 * @template TMetrics - The type of metrics to track
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerTrackSettings<TMetrics = unknown> = {
    /**
     * The current timestamp for metric evaluation.
     */
    currentDate: Date;

    /**
     * Initial metrics state before tracking begins.
     */
    initialMetrics: TMetrics;
};

/**
 * Pluggable policy contract defining the circuit breaker algorithm.
 * Implementations are responsible for tracking metrics, evaluating state transitions, and determining when to trip the circuit.
 * **Important:** All methods must be pure functions and should return new metrics objects without mutating input data.
 *
 * @template TMetrics - Custom metrics type for tracking failures, successes, and diagnostics
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerPolicy<TMetrics = unknown> = {
    /**
     * Creates initial metrics for a new circuit breaker instance.
     *
     * @returns A new metrics object in initial state
     */
    initialMetrics(): TMetrics;

    /**
     * Evaluates state transition when circuit breaker is in CLOSED state.
     * Analyzes current metrics to decide whether to open the circuit or remain closed.
     *
     * @param currentMetrics - Current failure/success metrics
     * @param currentDate - Current timestamp for time-based evaluations
     * @returns Transition decision: TO_OPEN or NONE
     */
    whenClosed(currentMetrics: TMetrics, currentDate: Date): ClosedTransitions;

    /**
     * Evaluates state transition when circuit breaker is in HALF_OPEN state.
     * Determines if recovery succeeded, recovery failed, or testing should continue.
     *
     * @param currentMetrics - Current recovery testing metrics
     * @param currentDate - Current timestamp for time-based evaluations
     * @returns Transition decision: TO_OPEN, TO_CLOSED, or NONE
     */
    whenHalfOpened(
        currentMetrics: TMetrics,
        currentDate: Date,
    ): HalfOpenTransitions;

    /**
     * Updates metrics after a failure is detected.
     * Used to accumulate failure counts, timestamps, and other diagnostic data.
     *
     * @param currentState - The current circuit breaker tracking state
     * @param settings - Configuration including current date and initial metrics
     * @returns Updated metrics reflecting the failure
     */
    trackFailure(
        currentState: CircuitBreakerTrackState<TMetrics>,
        settings: CircuitBreakerTrackSettings<TMetrics>,
    ): TMetrics;

    /**
     * Updates metrics after a successful call is recorded.
     * Used to reset failure counts or accumulate success data for recovery validation.
     *
     * @param currentState - The current circuit breaker tracking state
     * @param settings - Configuration including current date and initial metrics
     * @returns Updated metrics reflecting the success
     */
    trackSuccess(
        currentState: CircuitBreakerTrackState<TMetrics>,
        settings: CircuitBreakerTrackSettings<TMetrics>,
    ): TMetrics;

    /**
     * Compares two metrics objects for equality.
     * Used internally for optimization purposes to detect when metrics haven't changed.
     * This method is optional - if not implemented, every update is treated as a change.
     *
     * @param metricsA - First metrics object to compare
     * @param metricsB - Second metrics object to compare
     * @returns true if both metrics are equivalent, false otherwise
     */
    isEqual?(metricsA: TMetrics, metricsB: TMetrics): boolean;
};

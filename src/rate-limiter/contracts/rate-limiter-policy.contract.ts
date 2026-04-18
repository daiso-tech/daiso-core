/**
 * @module RateLimiter
 */

/**
 * Policy contract defining the rate limiting algorithm and metrics tracking.
 * Implements the algorithm logic that determines when requests should be allowed or blocked.
 *
 * All methods in this contract must be pure functions (no side effects, no mutations of input data).
 * Implementations should return new copies of metrics rather than modifying the input.
 * This allows the rate limiter to be stateless and thread-safe.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 * @template TMetrics - The type of metrics object used to track rate limiter state (e.g., attempt counts, timestamps)
 */
export type IRateLimiterPolicy<TMetrics = unknown> = {
    /**
     * Creates initial metrics for a new rate limiter.
     * Called when initializing a rate limiter for the first time or after expiration.
     * Should set up the data structures needed to track attempts in the current window.
     *
     * @param currentDate Current date/time for initializing window boundaries
     * @returns Fresh metrics object ready to track attempts
     */
    initialMetrics(currentDate: Date): TMetrics;

    /**
     * Determines if the rate limiter should block the current request.
     * Evaluates current metrics against the configured limit.
     * Returns true if the attempt limit has been exceeded (request should be blocked).
     *
     * @param currentMetrics The current tracking metrics
     * @param limit Maximum allowed attempts in the window
     * @param currentDate Current date/time for window boundary checks
     * @returns true if request should be blocked, false if allowed
     */
    shouldBlock(
        currentMetrics: TMetrics,
        limit: number,
        currentDate: Date,
    ): boolean;

    /**
     * Calculates the expiration date for the current metrics.
     * Determines when the rate limiter state should be automatically cleaned up.
     *
     * This method is critical for persistence: data persisted beyond this date should be deleted.
     * If this method returns a date in the past, the adapter should treat
     * the rate limiter as expired and allow requests with fresh metrics calculation.
     *
     * Common patterns:
     * - Fixed-window: Return date of window end (e.g., start + duration)
     * - Sliding-window: Return earliest tracked request + duration
     *
     * @param currentMetrics The current tracking metrics
     * @param currentDate Current date/time for calculating expiration
     * @returns Date when this rate limiter state should expire and be cleaned up
     */
    getExpiration(currentMetrics: TMetrics, currentDate: Date): Date;

    /**
     * Extracts the number of attempts used from the current metrics.
     * Used by the adapter to provide state information to callers.
     * This is the current attempt count within the configured limit.
     *
     * @param currentMetrics The current tracking metrics
     * @param currentDate Current date/time for calculations (e.g., accounting for expired requests)
     * @returns Number of attempts consumed in the current window
     */
    getAttempts(currentMetrics: TMetrics, currentDate: Date): number;

    /**
     * Updates metrics to record a new attempt.
     * Called each time a request is evaluated by the rate limiter.
     * Must return a new metrics object; the input should not be mutated.
     *
     * The returned metrics are stored and used for subsequent evaluations.
     * For persistent storage, this updated state is serialized and persisted.
     *
     * @param currentMetrics The metrics before this attempt
     * @param currentDate Current date/time for the attempt
     * @returns New metrics object with the attempt recorded
     */
    updateMetrics(currentMetrics: TMetrics, currentDate: Date): TMetrics;
};

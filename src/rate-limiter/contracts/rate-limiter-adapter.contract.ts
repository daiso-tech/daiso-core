/**
 * @module RateLimiter
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type IRateLimiterFactory } from "@/rate-limiter/contracts/rate-limiter-factory.contract.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Low-level state snapshot for rate limiter operations.
 * Provides the current quota tracking metrics at the adapter level.
 * Contains information about success status, attempt count, and reset timing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterAdapterState = {
    /**
     * Indicates whether the attempt was successful (allowed) or blocked.
     * - true: Request was allowed, counter incremented
     * - false: Request was blocked due to limit being reached
     */
    success: boolean;

    /**
     * Sequential attempt number tracking usage in the current window.
     * Incremented on each call to updateState, regardless of success.
     */
    attempt: number;

    /**
     * Time span until the rate limiter resets to initial state.
     * Attempts counter and blocking status will reset after this duration.
     */
    resetTime: TimeSpan;
};

/**
 * Low-level adapter contract for rate limiter implementations.
 * Provides core operations for tracking attempts and enforcing limits without algorithm logic.
 * This contract is not meant to be used directly; instead use {@link IRateLimiterFactory | `IRateLimiterFactory`}.
 *
 * The adapter works with a policy interface that determines the blocking algorithm (e.g., fixed-window, sliding-window).
 * This separation allows multiple algorithm implementations to share the same storage layer.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterAdapter = {
    /**
     * Retrieves the current rate limiter state without modifying it.
     * Returns the tracking metrics if the rate limiter exists, otherwise null.
     *
     * @param context Readable execution context for the operation
     * @param key Unique identifier for the rate limiter
     * @returns Current adapter state if found, or null if not yet initialized
     */
    getState(
        context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterAdapterState | null>;

    /**
     * Updates the rate limiter state and checks against the configured limit.
     * Increments attempt counter and determines if the request should be allowed or blocked.
     * The decision logic is handled by the policy interface configured for this adapter.
     *
     * @param context Readable execution context for the operation
     * @param key Unique identifier for the rate limiter
     * @param limit Maximum allowed attempts in the current window
     * @returns Updated state with incremented attempt and success flag
     */
    updateState(
        context: IReadableContext,
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState>;

    /**
     * Resets the rate limiter to its initial state.
     * Clears all attempt tracking and lifts any blocking status.
     * Can be called even if the rate limiter has expired or was never initialized.
     *
     * @param context Readable execution context for the operation
     * @param key Unique identifier for the rate limiter to reset
     */
    reset(context: IReadableContext, key: string): Promise<void>;
};

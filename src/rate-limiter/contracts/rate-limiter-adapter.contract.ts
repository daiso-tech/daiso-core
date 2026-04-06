/**
 * @module RateLimiter
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type IRateLimiterFactory } from "@/rate-limiter/contracts/rate-limiter-factory.contract.js";
import { type TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Errors
 */
export type IRateLimiterAdapterState = {
    success: boolean;
    attempt: number;
    resetTime: TimeSpan;
};

/**
 * The `IRateLimiterAdapter` contract defines a way for managing rate limiters independent of the underlying technology and algorithm.
 * This contract is not meant to be used directly, instead you should use {@link IRateLimiterFactory | `IRateLimiterFactory`} contract.
 *
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Errors
 */
export type IRateLimiterAdapter = {
    /**
     * The `getState` method returns the state of the rate limiter.
     */
    getState(
        context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterAdapterState | null>;

    /**
     * The `updateState` method updates the state of the rate limiter and returns the new state.
     */
    updateState(
        context: IReadableContext,
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState>;

    /**
     * The `reset` method resets rate limiter to its initial state regardless of the current state.
     */
    reset(context: IReadableContext, key: string): Promise<void>;
};

/**
 * @module RateLimiter
 */

import { type IKey } from "@/namespace/contracts/_module.js";
import { type RateLimiterState } from "@/rate-limiter/contracts/_module.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BlockedRateLimiterError } from "@/rate-limiter/contracts/rate-limiter.errors.js";
import { type AsyncLazy } from "@/utilities/_module.js";

/**
 * State and metadata methods for a rate limiter instance.
 * Provides read-only access to rate limiter state and configuration properties.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterStateMethods = {
    /**
     * Retrieves the current state of the rate limiter.
     *
     * @returns The current rate limiter state (allowed, blocked, expired, etc.)
     */
    getState(): Promise<RateLimiterState>;

    /**
     * The unique identifier for this rate limiter instance.
     * Multiple rate limiter instances with the same key share the same request quota.
     */
    readonly key: IKey;

    /**
     * The maximum number of allowed requests within the rate limiting window.
     */
    readonly limit: number;
};

/**
 * Rate limiting operations for controlling request throughput.
 * Provides methods to execute async functions within rate limit constraints.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiter = IRateLimiterStateMethods & {
    /**
     * Executes an async function if the rate limit quota is available.
     * The request is blocked if the limit has been reached, throwing an error.
     *
     * @template TValue - The return type of the async function
     * @param asyncFn - The function to execute if rate limit allows
     * @returns The return value of the function
     * @throws {BlockedRateLimiterError} If the rate limiter has reached its limit
     */
    runOrFail<TValue = void>(asyncFn: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * Resets the rate limiter to its initial state.
     * Clears the request count and allows a fresh quota of requests.
     */
    reset(): Promise<void>;
};

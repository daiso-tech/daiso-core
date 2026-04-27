/**
 * @module RateLimiter
 */

import { type BackoffPolicy } from "@/backoff-policies/implementations/_module.js";
import { RATE_LIMITER_STATE } from "@/rate-limiter/contracts/_module.js";
import {
    type AllRateLimiterState,
    type InternalRateLimiterPolicy,
} from "@/rate-limiter/implementations/adapters/database-rate-limiter-adapter/internal-rate-limiter-policy.js";

/**
 * @internal
 */
export class RateLimiterStateManager<TMetrics = unknown> {
    constructor(
        private readonly rateLimiterPolicy: InternalRateLimiterPolicy<TMetrics>,
        private readonly backoffPolicy: BackoffPolicy,
    ) {}

    updateState =
        (limit: number, currentDate: Date) =>
        (
            currentState: AllRateLimiterState<TMetrics>,
        ): AllRateLimiterState<TMetrics> => {
            if (currentState.type === RATE_LIMITER_STATE.ALLOWED) {
                return this.rateLimiterPolicy.whenAllowed(
                    currentState,
                    limit,
                    currentDate,
                );
            }
            return this.rateLimiterPolicy.whenBlocked(currentState, {
                currentDate,
                backoffPolicy: this.backoffPolicy,
            });
        };

    track =
        (currentDate: Date) =>
        (
            currentState: AllRateLimiterState<TMetrics>,
        ): AllRateLimiterState<TMetrics> => {
            if (currentState.type === RATE_LIMITER_STATE.ALLOWED) {
                return this.rateLimiterPolicy.trackWhenAllowed(
                    currentState,
                    currentDate,
                );
            }

            return this.rateLimiterPolicy.trackWhenBlocked(currentState);
        };
}

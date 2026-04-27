/**
 * @module RateLimiter
 */

import { type BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import {
    RATE_LIMITER_STATE,
    type IRateLimiterPolicy,
} from "@/rate-limiter/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { callInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export type AllowedState<TMetrics = unknown> = {
    type: (typeof RATE_LIMITER_STATE)["ALLOWED"];
    metrics: TMetrics;
};

/**
 * @internal
 */
export type BlockedState = {
    type: (typeof RATE_LIMITER_STATE)["BLOCKED"];
    /**
     * Unix timestamp in miliseconds
     */
    startedAt: number;
    attempt: number;
};

/**
 * @internal
 */
export type AllRateLimiterState<TMetrics = unknown> =
    | AllowedState<TMetrics>
    | BlockedState;

/**
 * @internal
 */
export type BackoffPolicySettings = {
    currentDate: Date;
    backoffPolicy: BackoffPolicy;
};

/**
 * @internal
 */
export class InternalRateLimiterPolicy<TMetrics = unknown> {
    constructor(
        private readonly rateLimiterPolicy: IRateLimiterPolicy<TMetrics>,
    ) {}

    initialState(currentDate: Date): AllowedState<TMetrics> {
        return {
            type: RATE_LIMITER_STATE.ALLOWED,
            metrics: this.rateLimiterPolicy.initialMetrics(currentDate),
        };
    }

    whenAllowed(
        currentState: AllowedState<TMetrics>,
        limit: number,
        currentDate: Date,
    ): AllRateLimiterState<TMetrics> {
        if (
            this.rateLimiterPolicy.shouldBlock(
                currentState.metrics,
                limit,
                currentDate,
            )
        ) {
            return {
                type: RATE_LIMITER_STATE.BLOCKED,
                attempt: 1,
                startedAt: currentDate.getTime(),
            };
        }

        return currentState;
    }

    whenBlocked(
        currentState: BlockedState,
        settings: BackoffPolicySettings,
    ): AllRateLimiterState<TMetrics> {
        const waitTime = TimeSpan.fromTimeSpan(
            callInvokable(settings.backoffPolicy, currentState.attempt, null),
        );
        const endDate = waitTime.toEndDate(new Date(currentState.startedAt));
        const isWaitTimeOver =
            endDate.getTime() <= settings.currentDate.getTime();

        if (isWaitTimeOver) {
            return {
                type: RATE_LIMITER_STATE.ALLOWED,
                metrics: this.rateLimiterPolicy.initialMetrics(
                    settings.currentDate,
                ),
            };
        }

        return currentState;
    }

    trackWhenAllowed(
        currentState: AllowedState<TMetrics>,
        currentDate: Date,
    ): AllowedState<TMetrics> {
        return {
            type: currentState.type,
            metrics: this.rateLimiterPolicy.updateMetrics(
                currentState.metrics,
                currentDate,
            ),
        };
    }

    trackWhenBlocked(currentState: BlockedState): BlockedState {
        return {
            type: currentState.type,
            startedAt: currentState.startedAt,
            attempt: currentState.attempt + 1,
        };
    }

    getExpiration(
        currentState: AllRateLimiterState<TMetrics>,
        settings: BackoffPolicySettings,
    ): Date {
        if (currentState.type === RATE_LIMITER_STATE.ALLOWED) {
            return this.rateLimiterPolicy.getExpiration(
                currentState.metrics,
                settings.currentDate,
            );
        }

        return TimeSpan.fromTimeSpan(
            callInvokable(settings.backoffPolicy, currentState.attempt, null),
        ).toEndDate(settings.currentDate);
    }

    getAttempts(
        currentState: AllRateLimiterState<TMetrics>,
        currentDate: Date,
    ): number {
        if (currentState.type === RATE_LIMITER_STATE.ALLOWED) {
            return this.rateLimiterPolicy.getAttempts(
                currentState.metrics,
                currentDate,
            );
        }
        return currentState.attempt;
    }
}

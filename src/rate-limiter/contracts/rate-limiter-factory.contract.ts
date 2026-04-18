/**
 * @module RateLimiter
 */

import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type IRateLimiter } from "@/rate-limiter/contracts/rate-limiter.contract.js";
import { type RateLimiterEventMap } from "@/rate-limiter/contracts/rate-limiter.events.js";
import { type ErrorPolicySettings } from "@/utilities/_module.js";

/**
 * Configuration settings for creating a rate limiter instance through the factory.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterFactoryCreateSettings = ErrorPolicySettings & {
    /**
     * If true, the rate limiter will only count function invocations that result in errors.
     * Successful executions will not consume from the rate limit quota.
     * If false, all invocations (successful or failed) are counted against the limit.
     */
    onlyError?: boolean;

    /**
     * Maximum number of allowed function invocations within the configured rate-limiter policy window.
     * Once this limit is reached, further invocations will be blocked ({@link BlockedRateLimiterError | `BlockedRateLimiterError`}) until the policy permits attempts again.
     */
    limit: number;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterFactoryBase = {
    create(
        key: string,
        settings: RateLimiterFactoryCreateSettings,
    ): IRateLimiter;
};

/**
 * The `IRateLimiterListenable` contract defines a way for listening {@link IRateLimiter | `IRateLimiter`} operations and state transitions.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterListenable = IEventListenable<RateLimiterEventMap>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterFactory = IRateLimiterFactoryBase & {
    readonly events: IRateLimiterListenable;
};

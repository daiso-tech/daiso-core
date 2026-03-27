/**
 * @module RateLimiter
 */

import { type IEventListenable } from "@/event-bus/contracts/_module.js";
import { type IRateLimiter } from "@/rate-limiter/contracts/rate-limiter.contract.js";
import { type RateLimiterEventMap } from "@/rate-limiter/contracts/rate-limiter.events.js";
import { type ErrorPolicySettings } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterFactoryCreateSettings = ErrorPolicySettings & {
    /**
     * If true will only apply rate limiting when function errors and not when function is called.
     * @default false
     */
    onlyError?: boolean;

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

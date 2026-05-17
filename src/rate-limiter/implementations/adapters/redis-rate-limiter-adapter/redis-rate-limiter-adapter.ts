/**
 * @module RateLimiter
 */

import { type Redis, type Result } from "ioredis";

import {
    BACKOFFS,
    resolveBackoffSettingsEnum,
    serializeBackoffSettingsEnum,
    type BackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type IRateLimiterAdapter,
    type IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module.js";
import { rateLimiterFactoryLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/_module.js";
import {
    LIMITER_POLICIES,
    resolveRateLimiterPolicySettings,
    serializeRateLimiterPolicySettingsEnum,
    type RateLimiterPolicySettingsEnum,
} from "@/rate-limiter/implementations/policies/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";

/**
 * @internal
 */
type IRedisJsonRateLimiterState = {
    success: boolean;
    attempt: number;
    resetTime: number;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        /**
         * @returns {string} {@link IRedisJsonRateLimiterState | `IRedisJsonRateLimiterState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        daiso_rate_limiter_update_state(
            key: string,
            limit: number,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<string, Context>;

        /**
         * @returns {string} {@link IRedisJsonRateLimiterState | `IRedisJsonRateLimiterState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        daiso_rate_limiter_get_state(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<string, Context>;
    }
}

/**
 * Configuration for `RedisRateLimiterAdapter`.
 * Requires a Redis client and handles serialization internally with JSON.stringify/JSON.parse.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter"`
 * @group Adapters
 */
export type RedisRateLimiterAdapterSettings = {
    /**
     * The Redis client instance for rate-limiter state operations.
     */
    database: Redis;

    /**
     * You can choose between different types of predefined backoff policies.
     * @default
     * ```ts
     * { type: BACKOFFS.EXPONENTIAL }
     * ```
     */
    backoffPolicy?: BackoffSettingsEnum;

    /**
     * You can choose between different types of predefined circuit breaker policies.
     * @default
     * ```ts
     * { type: LIMITER.FIXED_WINDOW }
     * ```
     */
    rateLimiterPolicy?: RateLimiterPolicySettingsEnum;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter"`
 * @group Adapters
 */
export class RedisRateLimiterAdapter implements IRateLimiterAdapter {
    private readonly backoff: Required<BackoffSettingsEnum>;

    private readonly policy: Required<RateLimiterPolicySettingsEnum>;

    private readonly database: Redis;

    /**
     * @example
     * ```ts
     * import { RedisRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/redis-rate-limiter-adapter";
     * import Redis from "ioredis";
     *
     * const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
     * const rateLimiterAdapter = new RedisRateLimiterAdapter({
     *   database
     * });
     * ```
     */
    constructor(settings: RedisRateLimiterAdapterSettings) {
        const {
            database,
            backoffPolicy = {
                type: BACKOFFS.EXPONENTIAL,
            },
            rateLimiterPolicy = {
                type: LIMITER_POLICIES.FIXED_WINDOW,
            },
        } = settings;

        this.database = database;
        this.backoff = resolveBackoffSettingsEnum(backoffPolicy);
        this.policy = resolveRateLimiterPolicySettings(rateLimiterPolicy);
        this.initGetStateCommand();
        this.initUpdateStateCommmand();
    }

    private initGetStateCommand(): void {
        if (typeof this.database.daiso_rate_limiter_get_state === "function") {
            return;
        }

        this.database.defineCommand("daiso_rate_limiter_get_state", {
            numberOfKeys: 1,
            lua: `
            ${rateLimiterFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local rateLimiter = rateLimiterFactory(backoffSettings, policySettings, currentDate)
            local state = rateLimiter.getState(key)
            return cjson.encode(state)
            `,
        });
    }

    private initUpdateStateCommmand(): void {
        if (
            typeof this.database.daiso_rate_limiter_update_state === "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_rate_limiter_update_state", {
            numberOfKeys: 1,
            lua: `
            ${rateLimiterFactoryLua}

            local key = KEYS[1];
            local limit = tonumber(ARGV[1]);
            local backoffSettings = cjson.decode(ARGV[2]);
            local policySettings = cjson.decode(ARGV[3]);
            local currentDate = tonumber(ARGV[4]);

            local rateLimiter = rateLimiterFactory(backoffSettings, policySettings, currentDate)
            local state = rateLimiter.updateState(key, limit)
            return cjson.encode(state)
            `,
        });
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterAdapterState | null> {
        const json = await this.database.daiso_rate_limiter_get_state(
            key,
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(serializeRateLimiterPolicySettingsEnum(this.policy)),
            Date.now(),
        );
        const state = JSON.parse(json) as IRedisJsonRateLimiterState | null;
        if (state === null) {
            return null;
        }
        return {
            success: state.success,
            attempt: state.attempt,
            resetTime: TimeSpan.fromDateRange({
                end: new Date(state.resetTime),
            }),
        };
    }

    async updateState(
        _context: IReadableContext,
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState> {
        const json = await this.database.daiso_rate_limiter_update_state(
            key,
            limit,
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(serializeRateLimiterPolicySettingsEnum(this.policy)),
            Date.now(),
        );
        const state = JSON.parse(json) as IRedisJsonRateLimiterState;
        return {
            success: state.success,
            attempt: state.attempt,
            resetTime: TimeSpan.fromDateRange({
                end: new Date(state.resetTime),
            }),
        };
    }

    async reset(_context: IReadableContext, key: string): Promise<void> {
        await this.database.del(key);
    }
}

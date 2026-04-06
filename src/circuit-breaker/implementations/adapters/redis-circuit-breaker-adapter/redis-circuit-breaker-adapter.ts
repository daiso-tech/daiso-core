/**
 * @module CircuitBreaker
 */

import { type Redis, type Result } from "ioredis";

import {
    BACKOFFS,
    resolveBackoffSettingsEnum,
    serializeBackoffSettingsEnum,
    type BackoffSettingsEnum,
} from "@/backoff-policies/_module.js";
import {
    type CircuitBreakerStateTransition,
    type ICircuitBreakerAdapter,
    type CircuitBreakerState,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module.js";
import { type AllCircuitBreakerState } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import { circuitBreakerFactoryLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/_module.js";
import {
    BREAKER_POLICIES,
    resolveCircuitBreakerPolicySettings,
    serializeCircuitBreakerPolicySettingsEnum,
    type CircuitBreakerPolicySettingsEnum,
} from "@/circuit-breaker/implementations/policies/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter"`
 * @group Adapters
 */
export type RedisCircuitBreakerAdapterSettings = {
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
     * { type: POLICIES.CONSECUTIVE }
     * ```
     */
    circuitBreakerPolicy?: CircuitBreakerPolicySettingsEnum;
};

declare module "ioredis" {
    interface RedisCommander<Context> {
        daiso_circuit_breaker_update_state(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<string, Context>;

        daiso_circuit_breaker_track_failure(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<void, Context>;

        daiso_circuit_breaker_track_success(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<void, Context>;
    }
}

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter"`
 * @group Adapters
 */
export class RedisCircuitBreakerAdapter implements ICircuitBreakerAdapter {
    private readonly backoff: Required<BackoffSettingsEnum>;

    private readonly policy: Required<CircuitBreakerPolicySettingsEnum>;

    private readonly database: Redis;

    /**
     * @example
     * ```ts
     * import { RedisCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/redis-circuit-breaker-adapter";
     * import Redis from "ioredis";
     *
     * const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
     * const circuitBreakerAdapter = new RedisCircuitBreakerAdapter({
     *   database
     * });
     * ```
     */
    constructor(settings: RedisCircuitBreakerAdapterSettings) {
        const {
            database,
            backoffPolicy = {
                type: BACKOFFS.EXPONENTIAL,
            },
            circuitBreakerPolicy = {
                type: BREAKER_POLICIES.CONSECUTIVE,
            },
        } = settings;

        this.database = database;
        this.backoff = resolveBackoffSettingsEnum(backoffPolicy);
        this.policy = resolveCircuitBreakerPolicySettings(circuitBreakerPolicy);

        this.initUpdateStateCommmand();
        this.initTrackFailureCommmand();
        this.initTrackSuccessCommmand();
    }

    private initUpdateStateCommmand(): void {
        if (
            typeof this.database.daiso_circuit_breaker_update_state ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_circuit_breaker_update_state", {
            numberOfKeys: 1,
            lua: `
            ${circuitBreakerFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local circuitBreaker = circuitBreakerFactory(backoffSettings, policySettings, currentDate)
            local transition = circuitBreaker.updateState(key)
            return cjson.encode(transition)
            `,
        });
    }

    private initTrackFailureCommmand(): void {
        if (
            typeof this.database.daiso_circuit_breaker_track_failure ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_circuit_breaker_track_failure", {
            numberOfKeys: 1,
            lua: `
            ${circuitBreakerFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local circuitBreaker = circuitBreakerFactory(backoffSettings, policySettings, currentDate)
            circuitBreaker.trackFailure(key)
            `,
        });
    }

    private initTrackSuccessCommmand(): void {
        if (
            typeof this.database.daiso_circuit_breaker_track_success ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("daiso_circuit_breaker_track_success", {
            numberOfKeys: 1,
            lua: `
            ${circuitBreakerFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local circuitBreaker = circuitBreakerFactory(backoffSettings, policySettings, currentDate)
            circuitBreaker.trackSuccess(key)
            `,
        });
    }

    async getState(
        _context: IReadableContext,
        key: string,
    ): Promise<CircuitBreakerState> {
        const value = await this.database.get(key);
        if (value === null) {
            return CIRCUIT_BREAKER_STATE.CLOSED;
        }
        const state = JSON.parse(value) as AllCircuitBreakerState;
        return state.type;
    }

    async updateState(
        _context: IReadableContext,
        key: string,
    ): Promise<CircuitBreakerStateTransition> {
        const value = await this.database.daiso_circuit_breaker_update_state(
            key,
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(
                serializeCircuitBreakerPolicySettingsEnum(this.policy),
            ),
            Date.now(),
        );
        return JSON.parse(value) as CircuitBreakerStateTransition;
    }

    async isolate(_context: IReadableContext, key: string): Promise<void> {
        await this.database.set(
            key,
            JSON.stringify({
                type: CIRCUIT_BREAKER_STATE.ISOLATED,
            }),
        );
    }

    async trackFailure(_context: IReadableContext, key: string): Promise<void> {
        await this.database.daiso_circuit_breaker_track_failure(
            key,
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(
                serializeCircuitBreakerPolicySettingsEnum(this.policy),
            ),
            Date.now(),
        );
    }

    async trackSuccess(_context: IReadableContext, key: string): Promise<void> {
        await this.database.daiso_circuit_breaker_track_success(
            key,
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(
                serializeCircuitBreakerPolicySettingsEnum(this.policy),
            ),
            Date.now(),
        );
    }

    async reset(_context: IReadableContext, key: string): Promise<void> {
        await this.database.del(key);
    }
}

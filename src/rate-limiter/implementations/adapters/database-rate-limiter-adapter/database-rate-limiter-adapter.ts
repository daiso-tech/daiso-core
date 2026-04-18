/**
 * @module RateLimiter
 */

import {
    exponentialBackoff,
    type BackoffPolicy,
} from "@/backoff-policies/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    type IRateLimiterAdapter,
    type IRateLimiterAdapterState,
    type IRateLimiterPolicy,
    type IRateLimiterStorageAdapter,
} from "@/rate-limiter/contracts/_module.js";
import {
    InternalRateLimiterPolicy,
    type AllRateLimiterState,
} from "@/rate-limiter/implementations/adapters/database-rate-limiter-adapter/internal-rate-limiter-policy.js";
import { RateLimiterStateManager } from "@/rate-limiter/implementations/adapters/database-rate-limiter-adapter/rate-limiter-state-manager.js";
import { RateLimiterStorage } from "@/rate-limiter/implementations/adapters/database-rate-limiter-adapter/rate-limiter-storage.js";
import { FixedWindowLimiter } from "@/rate-limiter/implementations/policies/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

/**
 * Configuration for `DatabaseRateLimiterAdapter`.
 * Wraps a {@link IRateLimiterStorageAdapter | `IRateLimiterStorageAdapter`} with rate-limiter logic.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/database-rate-limiter-adapter"`
 * @group Adapters
 */
export type DatabaseRateLimiterAdapterSettings = {
    /**
     * The underlying storage adapter used to persist and retrieve rate-limiter state.
     */
    adapter: IRateLimiterStorageAdapter;

    /**
     * You can define your own {@link BackoffPolicy | `BackoffPolicy`}.
     * @default
     * ```ts
     * import { exponentialBackoff } from "@daiso-tech/core/backoff-policies";
     *
     * exponentialBackoff();
     * ```
     */
    backoffPolicy?: BackoffPolicy;

    /**
     * You can define your own {@link IRateLimiterPolicy | `IRateLimiterPolicy`}.
     * @default
     * ```ts
     * import { FixedWindowLimiter } from "@daiso-tech/core/rate-limiter/policies";
     *
     * new FixedWindowLimiter();
     * ```
     */
    rateLimiterPolicy?: IRateLimiterPolicy;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/database-rate-limiter-adapter"`
 * @group Adapters
 */
export class DatabaseRateLimiterAdapter<TMetrics = unknown>
    implements IRateLimiterAdapter
{
    private readonly rateLimiterStorage: RateLimiterStorage<TMetrics>;
    private readonly rateLimiterStateManager: RateLimiterStateManager<TMetrics>;

    /**
     * @example
     * ```ts
     * import { DatabaseRateLimiterAdapter } from "@daiso-tech/core/rate-limiter/database-rate-limiter-adapter";
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
     *
     * const rateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter();
     * const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
     *   adapter: rateLimiterStorageAdapter
     * });
     * ```
     */
    constructor(settings: DatabaseRateLimiterAdapterSettings) {
        const {
            adapter,
            backoffPolicy = exponentialBackoff(),
            rateLimiterPolicy = new FixedWindowLimiter(),
        } = settings;
        const internalRateLimiterPolicy = new InternalRateLimiterPolicy(
            rateLimiterPolicy as IRateLimiterPolicy<TMetrics>,
        );
        this.rateLimiterStorage = new RateLimiterStorage({
            adapter: adapter as IRateLimiterStorageAdapter<
                AllRateLimiterState<TMetrics>
            >,
            rateLimiterPolicy: internalRateLimiterPolicy,
            backoffPolicy,
        });
        this.rateLimiterStateManager = new RateLimiterStateManager(
            internalRateLimiterPolicy,
            backoffPolicy,
        );
    }

    async getState(
        context: IReadableContext,
        key: string,
    ): Promise<IRateLimiterAdapterState | null> {
        const state = await this.rateLimiterStorage.find(context, key);
        if (state === null) {
            return null;
        }
        return {
            success: state.success,
            attempt: state.attempt,
            resetTime: TimeSpan.fromDateRange({
                end: state.resetTime,
            }),
        };
    }

    async updateState(
        context: IReadableContext,
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState> {
        const currentDate = new Date();
        const track = this.rateLimiterStateManager.track(currentDate);
        const updateState = this.rateLimiterStateManager.updateState(
            limit,
            currentDate,
        );
        const state = await this.rateLimiterStorage.atomicUpdate({
            context,
            key,
            update: (prevState) => {
                const newState1 = track(prevState);
                const newState2 = updateState(newState1);
                return newState2;
            },
        });
        return {
            success: state.success,
            attempt: state.attempt,
            resetTime: TimeSpan.fromDateRange({
                end: state.resetTime,
            }),
        };
    }

    async reset(context: IReadableContext, key: string): Promise<void> {
        await this.rateLimiterStorage.remove(context, key);
    }
}

/**
 * @module RateLimiter
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IRateLimiterProvider,
    type IRateLimiterData,
    type IRateLimiterStorageAdapter,
    type IRateLimiterStorageAdapterTransaction,
} from "@/rate-limiter/contracts/_module.js";
import { type IDeinitizable, type InvokableFn } from "@/utilities/_module.js";

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type MemoryRateLimiterData<TType = unknown> = {
    state: TType;
    timeoutId: string | number | NodeJS.Timeout;
    expiration: Date;
};

/**
 * This `MemoryRateLimiterStorageAdapter` is used for easily facking {@link IRateLimiterProvider | `IRateLimiterProvider`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export class MemoryRateLimiterStorageAdapter<TType>
    implements IRateLimiterStorageAdapter<TType>, IDeinitizable
{
    /**
     * @example
     * ```ts
     * import { MemoryRateLimiterStorageAdapter } from "@daiso-tech/core/rate-limiter/memory-rate-limiter-storage-adapter";
     *
     * const rateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter();
     * ```
     */
    constructor(
        private readonly map = new Map<string, MemoryRateLimiterData<TType>>(),
    ) {}

    deInit(): Promise<void> {
        for (const [key, { timeoutId }] of this.map) {
            clearTimeout(timeoutId);
            this.map.delete(key);
        }
        this.map.clear();
        return Promise.resolve();
    }

    async transaction<TValue>(
        fn: InvokableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await fn({
            upsert: (
                key: string,
                state: TType,
                expiration: Date,
            ): Promise<void> => {
                const ttl = expiration.getTime() - Date.now();
                const timeoutId = setTimeout(() => {
                    this.map.delete(key);
                }, ttl);
                this.map.set(key, {
                    state,
                    expiration,
                    timeoutId,
                });
                return Promise.resolve();
            },
            find: (key: string): Promise<IRateLimiterData<TType> | null> => {
                return this.find(key);
            },
        });
    }

    find(key: string): Promise<IRateLimiterData<TType> | null> {
        const data = this.map.get(key);
        if (data === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            state: data.state,
            expiration: data.expiration,
        });
    }

    remove(key: string): Promise<void> {
        const data = this.map.get(key);
        if (data === undefined) {
            return Promise.resolve();
        }
        clearTimeout(data.timeoutId);
        this.map.delete(key);
        return Promise.resolve();
    }
}

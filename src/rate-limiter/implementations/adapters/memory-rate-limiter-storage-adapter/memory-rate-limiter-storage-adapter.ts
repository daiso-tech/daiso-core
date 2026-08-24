/**
 * @module RateLimiter
 */

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IRateLimiterFactory,
    IRateLimiterData,
    IRateLimiterStorageAdapter,
    IRateLimiterStorageAdapterTransaction,
} from "@/rate-limiter/contracts/_module.js";
import type {
    IDeinitizable,
    InvocableFn,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type MemoryRateLimiterData<TType = unknown> = {
    state: TType;
    expiration: Date;
};

/**
 * The `MemoryRateLimiterStorageAdapter` is used for easily facking {@link IRateLimiterFactory | `IRateLimiterFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export class MemoryRateLimiterStorageAdapter<TType>
    implements IRateLimiterStorageAdapter<TType>, IDeinitizable, IPrunable
{
    /**
     * @example
     * ```ts
     * import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
     *
     * const rateLimiterStorageAdapter = new MemoryRateLimiterStorageAdapter();
     * ```
     */
    constructor(
        private readonly map = new Map<string, MemoryRateLimiterData<TType>>(),
    ) {}

    removeAllExpired(): Promise<void> {
        for (const [key, entry] of this.map) {
            if (entry.expiration > new Date()) {
                continue;
            }
            this.map.delete(key);
        }
        return Promise.resolve();
    }

    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    async transaction<TValue>(
        fn: InvocableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
        _context: IReadableContext,
    ): Promise<TValue> {
        return await fn({
            upsert: (
                key: string,
                state: TType,
                expiration: Date,
                _nestedContext: IReadableContext,
            ): Promise<void> => {
                this.map.set(key, {
                    state,
                    expiration,
                });
                return Promise.resolve();
            },
            find: (
                key: string,
                _nestedContext: IReadableContext,
            ): Promise<IRateLimiterData<TType> | null> => {
                return this.find(key, _nestedContext);
            },
        });
    }

    find(
        key: string,
        _context: IReadableContext,
    ): Promise<IRateLimiterData<TType> | null> {
        const data = this.map.get(key);
        if (data === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            state: data.state,
            expiration: data.expiration,
        });
    }

    remove(key: string, _context: IReadableContext): Promise<void> {
        const data = this.map.get(key);
        if (data === undefined) {
            return Promise.resolve();
        }
        this.map.delete(key);
        return Promise.resolve();
    }
}

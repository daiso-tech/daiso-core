/**
 * @module RateLimiter
 */

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type IRateLimiterFactory,
    type IRateLimiterData,
    type IRateLimiterStorageAdapter,
    type IRateLimiterStorageAdapterTransaction,
} from "@/rate-limiter/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/no-op-rate-limiter-storage-adapter"`
 * @internal
 */
class NoOpRateLimiterStorageAdapterTransaction<TType>
    implements IRateLimiterStorageAdapterTransaction<TType>
{
    upsert(
        _context: IReadableContext,
        _key: string,
        _state: TType,
        _expiration: Date,
    ): Promise<void> {
        return Promise.resolve();
    }

    find(
        _context: IReadableContext,
        _key: string,
    ): Promise<IRateLimiterData<TType> | null> {
        return Promise.resolve(null);
    }
}

/**
 * The `NoOpRateLimiterStorageAdapterTransaction` will do nothing and is used for easily mocking {@link IRateLimiterFactory | `IRateLimiterFactory`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/no-op-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export class NoOpRateLimiterStorageAdapter<TType>
    implements IRateLimiterStorageAdapter<TType>
{
    transaction<TValue>(
        _context: IReadableContext,
        fn: InvokableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return Promise.resolve(
            fn(new NoOpRateLimiterStorageAdapterTransaction()),
        );
    }

    find(
        _context: IReadableContext,
        _key: string,
    ): Promise<IRateLimiterData<TType> | null> {
        return Promise.resolve(null);
    }

    remove(_context: IReadableContext, _key: string): Promise<void> {
        return Promise.resolve();
    }
}

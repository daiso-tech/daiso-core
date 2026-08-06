/**
 * @module CircuitBreaker
 */

import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ICircuitBreakerFactory,
    ICircuitBreakerStorageAdapter,
    ICircuitBreakerStorageAdapterTransaction,
} from "@/circuit-breaker/contracts/_module.js";
import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type { InvocableFn } from "@/utilities/_module.js";

/**
 * The `NoOpCircuitBreakerStorageAdapter` will do nothing and is used for easily mocking {@link ICircuitBreakerFactory | `ICircuitBreakerFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/database-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class NoOpCircuitBreakerStorageAdapter<
    TType,
> implements ICircuitBreakerStorageAdapter<TType> {
    transaction<TValue>(
        fn: InvocableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
        _context: IReadableContext,
    ): Promise<TValue> {
        return Promise.resolve(
            fn({
                find: (
                    _key: string,
                    _nestedContext: IReadableContext,
                ): Promise<TType | null> => Promise.resolve(null),
                upsert: (
                    _key: string,
                    _state: TType,
                    _nestedContext: IReadableContext,
                ) => Promise.resolve(),
            }),
        );
    }

    find(_key: string, _context: IReadableContext): Promise<TType | null> {
        return Promise.resolve(null);
    }

    remove(_key: string, _context: IReadableContext): Promise<void> {
        return Promise.resolve();
    }
}

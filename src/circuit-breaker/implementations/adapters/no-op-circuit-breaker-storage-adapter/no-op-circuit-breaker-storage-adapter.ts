/**
 * @module CircuitBreaker
 */

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ICircuitBreakerProvider,
    type ICircuitBreakerStorageAdapter,
    type ICircuitBreakerStorageAdapterTransaction,
} from "@/circuit-breaker/contracts/_module.js";
import { type InvokableFn } from "@/utilities/_module.js";

/**
 * This `NoOpCircuitBreakerStorageAdapter` will do nothing and is used for easily mocking {@link ICircuitBreakerProvider | `ICircuitBreakerProvider`} for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/database-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class NoOpCircuitBreakerStorageAdapter<TType>
    implements ICircuitBreakerStorageAdapter<TType>
{
    transaction<TValue>(
        fn: InvokableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return Promise.resolve(
            fn({
                find: (_key: string): Promise<TType | null> =>
                    Promise.resolve(null),
                upsert: (_key: string, _state: TType) => Promise.resolve(),
            }),
        );
    }

    find(_key: string): Promise<TType | null> {
        return Promise.resolve(null);
    }

    remove(_key: string): Promise<void> {
        return Promise.resolve();
    }
}

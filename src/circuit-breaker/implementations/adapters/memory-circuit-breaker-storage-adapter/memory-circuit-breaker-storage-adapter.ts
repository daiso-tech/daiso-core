/**
 * @module CircuitBreaker
 */

import {
    type ICircuitBreakerStorageAdapter,
    type ICircuitBreakerStorageAdapterTransaction,
} from "@/circuit-breaker/contracts/circuit-breaker-storage-adapter.contract.js";
import { type IDeinitizable, type InvokableFn } from "@/utilities/_module.js";

/**
 * Note the `MemoryCircuitBreakerStorageAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for testing.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class MemoryCircuitBreakerStorageAdapter<TType = unknown>
    implements ICircuitBreakerStorageAdapter<TType>, IDeinitizable
{
    /**
     *  @example
     * ```ts
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
     *
     * const circuitBreakerStorageAdapter = new MemoryCircuitBreakerStorageAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
     *
     * const map = new Map<any, any>();
     * const circuitBreakerStorageAdapter = new MemoryCircuitBreakerStorageAdapter(map);
     * ```
     */
    constructor(private readonly map = new Map<string, TType>()) {}

    /**
     * Removes all in-memory circuit breaker data.
     */
    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    private upsert(key: string, state: TType): Promise<void> {
        this.map.set(key, state);
        return Promise.resolve();
    }

    async transaction<TValue>(
        fn: InvokableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await fn({
            upsert: (key, state) => this.upsert(key, state),
            find: (key) => this.find(key),
        });
    }

    async find(key: string): Promise<TType | null> {
        return Promise.resolve(this.map.get(key) ?? null);
    }

    async remove(key: string): Promise<void> {
        this.map.delete(key);
        return Promise.resolve();
    }
}

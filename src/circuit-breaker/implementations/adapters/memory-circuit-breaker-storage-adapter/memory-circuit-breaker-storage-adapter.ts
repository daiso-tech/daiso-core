/**
 * @module CircuitBreaker
 */

import type {
    ICircuitBreakerStorageAdapter,
    ICircuitBreakerStorageAdapterTransaction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ICircuitBreakerFactory,
} from "@/circuit-breaker/contracts/_module.js";
import type { IDeinitizable, InvocableFn } from "@/utilities/_module.js";

/**
 * The `MemoryCircuitBreakerStorageAdapter` is used for easily facking {@link ICircuitBreakerFactory | `ICircuitBreakerFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class MemoryCircuitBreakerStorageAdapter<TType = unknown>
    implements ICircuitBreakerStorageAdapter<TType>, IDeinitizable
{
    /**
     *  @example
     * ```ts
     * import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
     *
     * const circuitBreakerStorageAdapter = new MemoryCircuitBreakerStorageAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
     *
     * const map = new Map<string, any>();
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
        fn: InvocableFn<
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

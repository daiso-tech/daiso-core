/**
 * @module CircuitBreaker
 */

import {
    type ICircuitBreakerStorageAdapter,
    type ICircuitBreakerStorageAdapterTransaction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ICircuitBreakerFactory,
} from "@/circuit-breaker/contracts/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { type IDeinitizable, type InvokableFn } from "@/utilities/_module.js";

/**
 * The `MemoryCircuitBreakerStorageAdapter` is used for easily facking {@link ICircuitBreakerFactory | `ICircuitBreakerFactory`} for testing.
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

    private upsert(
        _context: IReadableContext,
        key: string,
        state: TType,
    ): Promise<void> {
        this.map.set(key, state);
        return Promise.resolve();
    }

    async transaction<TValue>(
        _context: IReadableContext,
        fn: InvokableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await fn({
            upsert: (context, key, state) => this.upsert(context, key, state),
            find: (context, key) => this.find(context, key),
        });
    }

    async find(_context: IReadableContext, key: string): Promise<TType | null> {
        return Promise.resolve(this.map.get(key) ?? null);
    }

    async remove(_context: IReadableContext, key: string): Promise<void> {
        this.map.delete(key);
        return Promise.resolve();
    }
}

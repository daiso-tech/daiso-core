/**
 * @module CircuitBreaker
 */

import {
    exponentialBackoff,
    type BackoffPolicy,
} from "@/backoff-policies/_module.js";
import {
    type ICircuitBreakerAdapter,
    type ICircuitBreakerStorageAdapter,
    type CircuitBreakerState,
    type CircuitBreakerStateTransition,
    type ICircuitBreakerPolicy,
} from "@/circuit-breaker/contracts/_module.js";
import { CircuitBreakerStateManager } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/circuit-breaker-state-manager.js";
import { CircuitBreakerStorage } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/circuit-breaker-storage.js";
import {
    InternalCircuitBreakerPolicy,
    type AllCircuitBreakerState,
} from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import { ConsecutiveBreaker } from "@/circuit-breaker/implementations/policies/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter"`
 * @group Adapters
 */
export type DatabaseCircuitBreakerAdapterSettings = {
    adapter: ICircuitBreakerStorageAdapter;

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
     * You can define your own {@link ICircuitBreakerPolicy | `ICircuitBreakerPolicy`}.
     * @default
     * ```ts
     * import { ConsecutiveBreaker } from "@daiso-tech/core/circuit-breaker/policies";
     *
     * new ConsecutiveBreaker();
     * ```
     */
    circuitBreakerPolicy?: ICircuitBreakerPolicy;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter"`
 * @group Adapters
 */
export class DatabaseCircuitBreakerAdapter<TMetrics = unknown>
    implements ICircuitBreakerAdapter
{
    private readonly circuitBreakerStorage: CircuitBreakerStorage<TMetrics>;
    private readonly circuitBreakerStateManager: CircuitBreakerStateManager<TMetrics>;

    /**
     * @example
     * ```ts
     * import { DatabaseCircuitBreakerAdapter } from "@daiso-tech/core/circuit-breaker/database-circuit-breaker-adapter";
     * import { MemoryCircuitBreakerStorageAdapter } from "@daiso-tech/core/circuit-breaker/memory-circuit-breaker-storage-adapter";
     *
     * const circuitBreakerStorageAdapter = new MemoryCircuitBreakerStorageAdapter();
     * const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
     *   adapter: circuitBreakerStorageAdapter
     * });
     * ```
     */
    constructor(settings: DatabaseCircuitBreakerAdapterSettings) {
        const {
            adapter,
            backoffPolicy = exponentialBackoff(),
            circuitBreakerPolicy = new ConsecutiveBreaker({
                failureThreshold: 5,
            }),
        } = settings;

        const internalCircuitBreakerPolicy = new InternalCircuitBreakerPolicy(
            circuitBreakerPolicy as ICircuitBreakerPolicy<TMetrics>,
        );
        this.circuitBreakerStorage = new CircuitBreakerStorage(
            adapter as ICircuitBreakerStorageAdapter<
                AllCircuitBreakerState<TMetrics>
            >,
            internalCircuitBreakerPolicy,
        );
        this.circuitBreakerStateManager = new CircuitBreakerStateManager(
            internalCircuitBreakerPolicy,
            backoffPolicy,
        );
    }

    async getState(
        context: IReadableContext,
        key: string,
    ): Promise<CircuitBreakerState> {
        const state = await this.circuitBreakerStorage.find(context, key);
        return state.type;
    }

    async updateState(
        context: IReadableContext,
        key: string,
    ): Promise<CircuitBreakerStateTransition> {
        return await this.circuitBreakerStorage.atomicUpdate(
            context,
            key,
            this.circuitBreakerStateManager.updateState,
        );
    }

    async trackFailure(context: IReadableContext, key: string): Promise<void> {
        await this.circuitBreakerStorage.atomicUpdate(
            context,
            key,
            this.circuitBreakerStateManager.trackFailure,
        );
    }

    async trackSuccess(context: IReadableContext, key: string): Promise<void> {
        await this.circuitBreakerStorage.atomicUpdate(
            context,
            key,
            this.circuitBreakerStateManager.trackSuccess,
        );
    }

    async reset(context: IReadableContext, key: string): Promise<void> {
        await this.circuitBreakerStorage.remove(context, key);
    }

    async isolate(context: IReadableContext, key: string): Promise<void> {
        await this.circuitBreakerStorage.atomicUpdate(
            context,
            key,
            this.circuitBreakerStateManager.isolate,
        );
    }
}

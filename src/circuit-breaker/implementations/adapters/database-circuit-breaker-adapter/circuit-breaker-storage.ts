/**
 * @module CircuitBreaker
 */

import type {
    ICircuitBreakerStorageAdapter,
    CircuitBreakerStateTransition,
} from "@/circuit-breaker/contracts/_module.js";
import type {
    AllCircuitBreakerState,
    InternalCircuitBreakerPolicy,
} from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import type { DatabaseCircuitBreakerUpdateStateFn } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/types.js";

/**
 * @internal
 */
export class CircuitBreakerStorage<TMetrics = unknown> {
    constructor(
        private readonly adapter: ICircuitBreakerStorageAdapter<
            AllCircuitBreakerState<TMetrics>
        >,
        private readonly circuitBreakerPolicy: InternalCircuitBreakerPolicy<TMetrics>,
    ) {}

    async atomicUpdate(
        key: string,
        update: DatabaseCircuitBreakerUpdateStateFn<TMetrics>,
    ): Promise<CircuitBreakerStateTransition> {
        const currentDate = new Date();
        return await this.adapter.transaction(async (trx) => {
            const currentState =
                (await trx.find(key)) ??
                this.circuitBreakerPolicy.initialState();

            const newState = update(currentState, currentDate);

            if (!this.circuitBreakerPolicy.isEqual(currentState, newState)) {
                await trx.upsert(key, newState);
            }

            return {
                from: currentState.type,
                to: newState.type,
            };
        });
    }

    async find(key: string): Promise<AllCircuitBreakerState<TMetrics>> {
        return (
            (await this.adapter.find(key)) ??
            this.circuitBreakerPolicy.initialState()
        );
    }

    async remove(key: string): Promise<void> {
        await this.adapter.remove(key);
    }
}

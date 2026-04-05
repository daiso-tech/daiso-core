/**
 * @module CircuitBreaker
 */

import {
    type ICircuitBreakerStorageAdapter,
    type CircuitBreakerStateTransition,
} from "@/circuit-breaker/contracts/_module.js";
import {
    type AllCircuitBreakerState,
    type InternalCircuitBreakerPolicy,
} from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import { type DatabaseCircuitBreakerUpdateStateFn } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/types.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";

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
        context: IReadableContext,
        key: string,
        update: DatabaseCircuitBreakerUpdateStateFn<TMetrics>,
    ): Promise<CircuitBreakerStateTransition> {
        const currentDate = new Date();
        return await this.adapter.transaction(context, async (trx) => {
            const currentState =
                (await trx.find(context, key)) ??
                this.circuitBreakerPolicy.initialState();

            const newState = update(currentState, currentDate);

            if (!this.circuitBreakerPolicy.isEqual(currentState, newState)) {
                await trx.upsert(context, key, newState);
            }

            return {
                from: currentState.type,
                to: newState.type,
            };
        });
    }

    async find(
        context: IReadableContext,
        key: string,
    ): Promise<AllCircuitBreakerState<TMetrics>> {
        return (
            (await this.adapter.find(context, key)) ??
            this.circuitBreakerPolicy.initialState()
        );
    }

    async remove(context: IReadableContext, key: string): Promise<void> {
        await this.adapter.remove(context, key);
    }
}

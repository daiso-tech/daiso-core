/**
 * @module CircuitBreaker
 */
import { type AllCircuitBreakerState } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import { type InvocableFn } from "@/utilities/_module.js";

/**
 * @internal
 */
export type DatabaseCircuitBreakerUpdateStateFn<TMetrics = unknown> =
    InvocableFn<
        [currentState: AllCircuitBreakerState<TMetrics>, currentDate: Date],
        AllCircuitBreakerState<TMetrics>
    >;

/**
 * @module CircuitBreaker
 */

import { type ICircuitBreakerFactory } from "@/circuit-breaker/contracts/circuit-breaker-factory.contract.js";

/**
 * Factory resolver contract for dynamically selecting circuit breaker factory implementations.
 * Enables seamless switching between different storage backends, policies, and adapters at runtime.
 * Implementations typically use adapter registration patterns to manage multiple implementations.
 *
 * IMPORT_PATH: `"@daiso-tech/core/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ICircuitBreakerFactoryResolver<TAdapters extends string = string> =
    {
        /**
         * Selects and returns a circuit breaker factory implementation.
         * If an adapter name is provided, that specific implementation is returned.
         * If no name is provided, the default registered adapter is used.
         *
         * @param adapterName - Optional name of a registered adapter implementation
         * @returns The selected circuit breaker factory
         * @throws {UnregisteredAdapterError} If the specified adapter name is not registered
         * @throws {DefaultAdapterNotDefinedError} If no adapter name is provided and no default adapter is configured
         */
        use(adapterName?: TAdapters): ICircuitBreakerFactory;
    };

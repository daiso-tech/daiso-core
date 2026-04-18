/**
 * @module RateLimiter
 */

import { type IRateLimiterFactory } from "@/rate-limiter/contracts/rate-limiter-factory.contract.js";

/**
 * Rate limiter factory resolver contract for dynamically selecting rate limiter factory implementations.
 * Abstracts the factory selection logic, allowing different implementations to be swapped at runtime.
 *
 * This resolver selects a registered rate limiter adapter and returns a factory that creates rate limiters with it.
 * Useful when the rate limiter backend needs to vary (e.g., memory, database, or Redis).
 *
 * @template TAdapters - Union type of registered adapter names (e.g., "memory" | "database" | "redis")
 *
 * IMPORT_PATH: `"@daiso-tech/core/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterFactoryResolver<TAdapters extends string = string> = {
    /**
     * Retrieves a rate limiter factory for the selected adapter.
     * If no adapter name is provided, uses the default registered adapter.
     *
     * @param adapterName - The adapter name to use (optional). If not provided, uses the default adapter.
     * @returns The requested rate limiter factory instance
     *
     * @throws {UnregisteredAdapterError} If the specified factory name is not registered
     * @throws {DefaultAdapterNotDefinedError} If no factory name is provided and no default factory is defined
     */
    use(adapterName?: TAdapters): IRateLimiterFactory;
};

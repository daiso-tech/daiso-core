/**
 * @module Cache
 */

import { type ICache } from "@/cache/contracts/cache.contract.js";

/**
 * Cache resolver contract for dynamically selecting and switching between cache adapters.
 * Simplifies adapter management by providing a single interface to access registered cache implementations.
 *
 * Typical usage:
 * - Development: Use in-memory cache
 * - Testing: Use no-op cache or mock
 * - Production: Use Redis or distributed cache
 * All without changing application code (just switch the configured adapter).
 *
 * @template TAdapters - Union type of registered adapter names (e.g., "memory" | "redis" | "memcached")
 * @template TType - The type of values cached (optional, defaults to unknown)
 *
 * IMPORT_PATH: `"@daiso-tech/core/cache/contracts"`
 * @group Contracts
 */
export type ICacheResolver<
    TAdapters extends string = string,
    TType = unknown,
> = {
    /**
     * Retrieves a cache adapter by name.
     * If no adapter name is provided, uses the default registered adapter.
     *
     * @param adapterName - The name of the adapter to retrieve (optional). If not provided, uses the default adapter.
     * @returns The requested cache adapter instance
     *
     * @throws {UnregisteredAdapterError} If the specified adapter name is not registered
     * @throws {DefaultAdapterNotDefinedError} If no adapter name is provided and no default adapter is defined
     */
    use(adapterName?: TAdapters): ICache<TType>;
};

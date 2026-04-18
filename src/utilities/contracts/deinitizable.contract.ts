/**
 * @module Utilities
 */

/**
 * Deinitialization contract for objects requiring async cleanup.
 * Implementers provide a way to tear down/finalize state after use.
 *
 * Counterpart to IInitizable - called during application shutdown.
 * Ensures graceful cleanup of resources: connections, file handles, listeners.
 *
 * Usage patterns:
 * - Database connection pools: close all connections, flush pending queries
 * - Caches: persist data, close backend connections
 * - Servers: stop listening, close client connections
 * - Event listeners: unregister, cleanup memory
 * - Locks: release held resources
 *
 * Typically called once during application shutdown, before process exit.
 * Should be idempotent when possible (calling deInit() multiple times is safe).
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IDeinitizable = {
    /**
     * Deinitializes the object.
     * Performs any async cleanup required to shut down gracefully.
     * Should release resources and finalize internal state.
     *
     * @returns Void promise (resolves when deinitialization complete)
     * @throws Error if deinitialization fails (should log but not block shutdown)
     */
    deInit(): Promise<void>;
};

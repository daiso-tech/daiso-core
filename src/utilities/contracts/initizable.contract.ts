/**
 * @module Utilities
 */

/**
 * Initialization contract for objects requiring async setup.
 * Implementers provide a way to initialize/prepare state before use.
 *
 * Usage patterns:
 * - Database connection pools: open connections, verify connectivity
 * - Caches: pre-load data, verify storage backend
 * - Servers: start listening, bind to ports
 * - Factories: load configuration, prepare templates
 *
 * Typically called once during application startup.
 * Should be idempotent when possible (calling init() multiple times is safe).
 *
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IInitizable = {
    /**
     * Initializes the object.
     * Performs any async setup required before the object is usable.
     * Should prepare internal state and verify system dependencies.
     *
     * @returns Void promise (resolves when initialization complete)
     * @throws Error if initialization fails (e.g., connection timeout, validation error)
     */
    init(): Promise<void>;
};

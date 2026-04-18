/**
 * @module FileStorage
 */

import { type IFileStorage } from "@/file-storage/contracts/_module.js";

/**
 * File storage resolver contract for dynamically selecting and switching between storage adapters.
 * Simplifies adapter management by providing a single interface to access registered storage implementations.
 *
 * Typical usage:
 * - Development: Use memory storage
 * - Testing: Use mock storage
 * - Production: Use S3 or cloud storage
 * All without changing application code (just switch the configured adapter).
 *
 * @template TAdapters - Union type of registered adapter names (e.g., "memory" | "s3" | "fs")
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorageResolver<TAdapters extends string = string> = {
    /**
     * Retrieves a file storage adapter by name.
     * If no adapter name is provided, uses the default registered adapter.
     *
     * @param adapterName - The name of the adapter to retrieve (optional). If not provided, uses the default adapter.
     * @returns The requested file storage adapter
     *
     * @throws {UnregisteredAdapterError} If the specified adapter name is not registered
     * @throws {DefaultAdapterNotDefinedError} If no adapter name is provided and no default adapter is defined
     */
    use(adapterName?: TAdapters): IFileStorage;
};

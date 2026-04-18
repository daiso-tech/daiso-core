/**
 * @module FileSize
 */

/**
 * Symbol key for FileSize conversion method.
 * Used to implement the `IFileSize` contract on file size objects.
 *
 * This symbol prevents naming conflicts by using a unique symbol as the property key.
 * Objects implementing IFileSize use this symbol to provide byte conversion.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-size/contracts"`
 * @group Contracts
 */
export const TO_BYTES = Symbol("TO_BYTES");

/**
 * File size contract enabling interoperability with external file size libraries.
 * Provides a standard way to convert any file size representation to bytes.
 *
 * Allows this library to work with external size libraries without direct dependencies:
 * - Byte wrapper objects
 * - Kilobyte/Megabyte/Gigabyte representations
 * - Custom file size classes
 *
 * Implementers need only provide one method: convert their file size format to bytes.
 *
 * Usage:
 * 1. Implement IFileSize on your file size class by computing the TO_BYTES method
 * 2. Pass instances to any daiso-core function accepting IFileSize
 * 3. The library will call the method to get byte values for size calculations
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-size/contracts"`
 * @group Contracts
 */
export type IFileSize = {
    /**
     * Converts this file size to total bytes.
     * Used by the library for all size-based calculations and comparisons.
     *
     * @returns Total file size in bytes (must be >= 0)
     */
    [TO_BYTES](): number;
};

/**
 * @module FileSize
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export const TO_BYTES = Symbol("TO_BYTES");

/**
 * The `IFileSize` contract enables interoperability with external file size libraries.
 *
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export type IFileSize = {
    [TO_BYTES](): number;
};

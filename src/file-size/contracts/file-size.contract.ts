/**
 * @module FileSize
 */

/**
 *
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export const TO_BYTES = Symbol("TO_BYTES");

/**
 * IMPORT_PATH: `"@daiso-tech/core/time-span/contracts"`
 * @group Contracts
 */
export type IFileSize = {
    [TO_BYTES](): number;
};

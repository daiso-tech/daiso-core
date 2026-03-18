/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 * @group Contracts
 */
export type IInitizable = {
    init(): Promise<void>;
};

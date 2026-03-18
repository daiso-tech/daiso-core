/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type NoneFunc<TType> = Exclude<
    TType,
    (...args: Array<unknown>) => unknown
>;

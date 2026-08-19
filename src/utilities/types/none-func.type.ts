/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type NoneFunc<TType> = Exclude<
    TType,
    (...args: Array<unknown>) => unknown
>;

/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type UndefinedToNull<T> =
    | Exclude<T, undefined>
    | (undefined extends T ? null : never);

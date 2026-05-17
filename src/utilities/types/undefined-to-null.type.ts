/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type UndefinedToNull<T> =
    | Exclude<T, undefined>
    | (undefined extends T ? null : never);

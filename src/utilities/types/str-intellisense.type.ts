/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type StrIntellisense<TStrLiterals extends string> =
    | TStrLiterals
    | (string & {});

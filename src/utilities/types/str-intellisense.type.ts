/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type StrIntellisense<TStrLiterals extends string> =
    | TStrLiterals
    | (string & {});

/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type IterableValue<TInput = unknown> =
    | Iterable<TInput>
    | ArrayLike<TInput>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type AsyncIterableValue<TInput = unknown> =
    | IterableValue<TInput>
    | AsyncIterable<TInput>;

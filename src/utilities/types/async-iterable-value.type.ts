/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type IterableValue<TInput = unknown> =
    Iterable<TInput> | ArrayLike<TInput>;

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type AsyncIterableValue<TInput = unknown> =
    IterableValue<TInput> | AsyncIterable<TInput>;

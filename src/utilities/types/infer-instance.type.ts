/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/utilities"`
 */
export type InferInstance<T> = T extends { new (...args: Array<any>): infer R }
    ? R
    : never;

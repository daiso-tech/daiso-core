/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 */
export type InferInstance<T> = T extends { new (...args: Array<any>): infer R }
    ? R
    : never;

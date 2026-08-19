/**
 * @module Collection
 */

import type { Invocable, Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type Transform<TInput, TOutput> = Invocable<[value: TInput], TOutput>;

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type AsyncTransform<TInput, TOutput> = Invocable<
    [value: TInput],
    Promisable<TOutput>
>;

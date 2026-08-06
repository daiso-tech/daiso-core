/**
 * @module Collection
 */

import type { Invocable, Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type Reduce<TInput, TCollection, TOutput> = Invocable<
    [output: TOutput, item: TInput, index: number, collection: TCollection],
    TOutput
>;

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type AsyncReduce<TInput, TCollection, TOutput> = Invocable<
    [output: TOutput, item: TInput, index: number, collection: TCollection],
    Promisable<TOutput>
>;

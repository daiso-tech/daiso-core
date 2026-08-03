/**
 * @module Collection
 */

import { type Invocable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type Map<TInput, TCollection, TOutput> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    TOutput
>;

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type AsyncMap<TInput, TCollection, TOutput> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    Promisable<TOutput>
>;

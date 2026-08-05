/**
 * @module Collection
 */

import type { Invocable, Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type ForEach<TInput, TCollection> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    void
>;

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type AsyncForEach<TInput, TCollection> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    Promisable<void>
>;

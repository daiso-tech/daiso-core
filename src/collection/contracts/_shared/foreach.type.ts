/**
 * @module Collection
 */

import { type Invocable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type ForEach<TInput, TCollection> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    void
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncForEach<TInput, TCollection> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    Promisable<void>
>;

/**
 * @module Collection
 */

import { type Invokable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type Reduce<TInput, TCollection, TOutput> = Invokable<
    [output: TOutput, item: TInput, index: number, collection: TCollection],
    TOutput
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncReduce<TInput, TCollection, TOutput> = Invokable<
    [output: TOutput, item: TInput, index: number, collection: TCollection],
    Promisable<TOutput>
>;

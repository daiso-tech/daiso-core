/**
 * @module Collection
 */

import { type Invocable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type Transform<TInput, TOutput> = Invocable<[value: TInput], TOutput>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncTransform<TInput, TOutput> = Invocable<
    [value: TInput],
    Promisable<TOutput>
>;

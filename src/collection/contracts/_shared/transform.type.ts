/**
 * @module Collection
 */

import { type Invokable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type Transform<TInput, TOutput> = Invokable<[value: TInput], TOutput>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncTransform<TInput, TOutput> = Invokable<
    [value: TInput],
    Promisable<TOutput>
>;

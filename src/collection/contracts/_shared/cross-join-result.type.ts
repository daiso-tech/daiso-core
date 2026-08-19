/**
 * @module Collection
 */

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type CrossJoinResult<TInput, TExtended> = TInput extends [
    infer R,
    ...infer L,
]
    ? [R, ...L, TExtended]
    : [TInput, TExtended];

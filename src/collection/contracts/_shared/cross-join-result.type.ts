/**
 * @module Collection
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type CrossJoinResult<TInput, TExtended> = TInput extends [
    infer R,
    ...infer L,
]
    ? [R, ...L, TExtended]
    : [TInput, TExtended];

/**
 * @module Collection
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type EnsureMap<TInput> = TInput extends
    | [infer TKey, infer TValue]
    | readonly [infer TKey, infer TValue]
    ? globalThis.Map<TKey, TValue>
    : never;

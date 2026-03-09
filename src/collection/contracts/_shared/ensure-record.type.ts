/**
 * @module Collection
 */

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type EnsureRecord<TInput> = TInput extends
    | [infer TKey, infer TValue]
    | readonly [infer TKey, infer TValue]
    ? TKey extends string | number | symbol
        ? Record<TKey, TValue>
        : never
    : never;

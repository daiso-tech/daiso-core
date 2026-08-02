/**
 * @module Collection
 */

import { type Invocable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type PredicateFn<TInput, TCollection> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    boolean
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type PredicateGuardFn<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> = (item: TInput, index: number, collection: TCollection) => item is TOutput;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type PredicateGuardInvocableObject<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> = {
    invoke(
        item: TInput,
        index: number,
        collection: TCollection,
    ): item is TOutput;
};

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type PredicateGuardInvocable<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> =
    | PredicateGuardFn<TInput, TCollection, TOutput>
    | PredicateGuardInvocableObject<TInput, TCollection, TOutput>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type PredicateInvocable<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> =
    | PredicateFn<TInput, TCollection>
    | PredicateGuardInvocable<TInput, TCollection, TOutput>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncPredicateInvocable<TInput, TCollection> = Invocable<
    [item: TInput, index: number, collection: TCollection],
    Promisable<boolean>
>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncPredicate<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> =
    | AsyncPredicateInvocable<TInput, TCollection>
    | PredicateGuardInvocable<TInput, TCollection, TOutput>;

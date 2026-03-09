/**
 * @module Collection
 */

import { type Invokable, type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type PredicateFn<TInput, TCollection> = Invokable<
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
export type PredicateGuardInvokableObject<
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
export type PredicateGuardInvokable<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> =
    | PredicateGuardFn<TInput, TCollection, TOutput>
    | PredicateGuardInvokableObject<TInput, TCollection, TOutput>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type PredicateInvokable<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> =
    | PredicateFn<TInput, TCollection>
    | PredicateGuardInvokable<TInput, TCollection, TOutput>;

/**
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncPredicateInvokable<TInput, TCollection> = Invokable<
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
    | AsyncPredicateInvokable<TInput, TCollection>
    | PredicateGuardInvokable<TInput, TCollection, TOutput>;

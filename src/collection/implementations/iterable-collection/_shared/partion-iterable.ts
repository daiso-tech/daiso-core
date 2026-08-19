/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module.js";

import type {
    PredicateInvocable,
    ICollection,
} from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class PartionIterable<TInput> implements Iterable<ICollection<TInput>> {
    constructor(
        private collection: ICollection<TInput>,
        private predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,

        private makeCollection: <TInput_>(
            iterable: Iterable<TInput_>,
        ) => ICollection<TInput_>,
    ) {}

    *[Symbol.iterator](): Iterator<ICollection<TInput>> {
        const arrayA: Array<TInput> = [];
        const arrayB: Array<TInput> = [];
        for (const [index, item] of this.collection.entries()) {
            if (
                resolveInvocable(this.predicateFn)(item, index, this.collection)
            ) {
                arrayA.push(item);
            } else {
                arrayB.push(item);
            }
        }
        yield this.makeCollection(arrayA);
        yield this.makeCollection(arrayB);
    }
}

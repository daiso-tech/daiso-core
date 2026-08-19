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
export class TakeUntilIterable<TInput> implements Iterable<TInput> {
    constructor(
        private collection: ICollection<TInput>,
        private predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        for (const [index, item] of this.collection.entries()) {
            if (
                resolveInvocable(this.predicateFn)(item, index, this.collection)
            ) {
                break;
            }
            yield item;
        }
    }
}

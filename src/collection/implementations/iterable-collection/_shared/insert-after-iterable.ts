/**
 * @module Collection
 */

import {
    type PredicateInvokable,
    type ICollection,
} from "@/collection/contracts/_module.js";
import { resolveInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class InsertAfterIterable<TInput, TExtended> implements Iterable<
    TInput | TExtended
> {
    constructor(
        private collection: ICollection<TInput>,
        private predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
        private iterable: Iterable<TInput | TExtended>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput | TExtended> {
        let hasMatched = false;
        for (const [index, item] of this.collection.entries()) {
            yield item;
            if (
                !hasMatched &&
                resolveInvokable(this.predicateFn)(item, index, this.collection)
            ) {
                yield* this.iterable;
                hasMatched = true;
            }
        }
    }
}

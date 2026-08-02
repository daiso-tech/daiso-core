/**
 * @module Collection
 */

import {
    type PredicateInvocable,
    type ICollection,
} from "@/collection/contracts/_module.js";
import { resolveInvocable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class SkipUntilIterable<TInput> implements Iterable<TInput> {
    constructor(
        private collection: ICollection<TInput>,
        private predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        let hasMatched = false;
        for (const [index, item] of this.collection.entries()) {
            if (!hasMatched) {
                hasMatched = resolveInvocable(this.predicateFn)(
                    item,
                    index,
                    this.collection,
                );
            }
            if (hasMatched) {
                yield item;
            }
        }
    }
}

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
export class FilterIterable<
    TInput,
    TOutput extends TInput,
> implements Iterable<TOutput> {
    constructor(
        private collection: ICollection<TInput>,
        private predicateFn: PredicateInvocable<
            TInput,
            ICollection<TInput>,
            TOutput
        >,
    ) {}

    *[Symbol.iterator](): Iterator<TOutput> {
        for (const [index, item] of this.collection.entries()) {
            if (
                resolveInvocable(this.predicateFn)(item, index, this.collection)
            ) {
                yield item as TOutput;
            }
        }
    }
}

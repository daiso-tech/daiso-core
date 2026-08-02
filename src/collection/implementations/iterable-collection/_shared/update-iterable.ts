/**
 * @module Collection
 */

import {
    type PredicateInvocable,
    type ICollection,
    type Map,
} from "@/collection/contracts/_module.js";
import { resolveInvocable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class ChangeIterable<
    TInput,
    TFilterOutput extends TInput,
    TMapOutput,
> implements Iterable<TInput | TFilterOutput | TMapOutput> {
    constructor(
        private collection: ICollection<TInput>,
        private predicateFn: PredicateInvocable<
            TInput,
            ICollection<TInput>,
            TFilterOutput
        >,
        private mapFn: Map<TFilterOutput, ICollection<TInput>, TMapOutput>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput | TFilterOutput | TMapOutput> {
        for (const [index, item] of this.collection.entries()) {
            if (
                resolveInvocable(this.predicateFn)(item, index, this.collection)
            ) {
                yield resolveInvocable(this.mapFn)(
                    item as TFilterOutput,
                    index,
                    this.collection,
                );
            } else {
                yield item;
            }
        }
    }
}

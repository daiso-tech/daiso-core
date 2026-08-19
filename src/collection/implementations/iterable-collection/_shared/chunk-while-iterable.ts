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
export class ChunkWhileIterable<TInput> implements Iterable<
    ICollection<TInput>
> {
    constructor(
        private collection: ICollection<TInput>,
        private predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
        private makeCollection: <TInput_>(
            iterable: Iterable<TInput_>,
        ) => ICollection<TInput_>,
    ) {}

    *[Symbol.iterator](): Iterator<ICollection<TInput>> {
        const array: Array<TInput> = [];
        for (const [index, item] of this.collection.entries()) {
            if (index === 0) {
                array.push(item);
            } else if (
                resolveInvocable(this.predicateFn)(
                    item,
                    index,
                    this.makeCollection(array),
                )
            ) {
                array.push(item);
            } else {
                yield this.makeCollection(array);
                array.length = 0;
                array.push(item);
            }
        }
        yield this.makeCollection(array);
    }
}

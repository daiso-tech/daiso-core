/**
 * @module Collection
 */

import { type ICollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class ReverseIterable<TInput> implements Iterable<TInput> {
    constructor(
        private collection: ICollection<TInput>,
        private chunkSize: number,

        private makeCollection: <TInput_>(
            iterable: Iterable<TInput_>,
        ) => ICollection<TInput_>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        yield* this.collection
            .chunk(this.chunkSize)
            .map((item) => this.makeCollection<TInput>([...item].reverse()))
            .reduce(
                (collection, item) => collection.prepend(item),
                this.makeCollection<TInput>([]),
            );
    }
}

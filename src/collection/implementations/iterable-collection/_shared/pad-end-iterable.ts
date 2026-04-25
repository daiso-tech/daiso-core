/**
 * @module Collection
 */

import { type ICollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class PadEndIterable<TInput, TExtended>
    implements Iterable<TInput | TExtended>
{
    constructor(
        private collection: ICollection<TInput>,
        private maxLength: number,
        private fillItems: Iterable<TExtended>,
        private makeCollection: <TInput_>(
            iterable: Iterable<TInput_ | TExtended>,
        ) => ICollection<TInput_ | TExtended>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput | TExtended> {
        const fillCollections = this.makeCollection<TInput>(this.fillItems);
        const fillSize = fillCollections.size();
        const size = this.collection.size();
        const repeat = Math.floor((this.maxLength - size) / fillSize);
        let resultCollection: ICollection<TInput | TExtended> =
            this.makeCollection<TInput>([]);
        for (let index = 0; index < repeat; index++) {
            resultCollection = resultCollection.append(fillCollections);
        }
        const restAmount = this.maxLength - (repeat * fillSize + size);
        resultCollection = resultCollection.append(
            fillCollections.slice(0, restAmount),
        );
        resultCollection = resultCollection.prepend(this.collection);
        yield* resultCollection;
    }
}

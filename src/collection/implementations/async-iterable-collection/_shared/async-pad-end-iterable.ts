/**
 * @module Collection
 */

import { type IAsyncCollection } from "@/collection/contracts/_module.js";
import { type AsyncIterableValue } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncPadEndIterable<TInput, TExtended>
    implements AsyncIterable<TInput | TExtended>
{
    constructor(
        private collection: IAsyncCollection<TInput>,
        private maxLength: number,
        private fillItems: AsyncIterableValue<TExtended>,
        private makeCollection: <TInput_>(
            iterable: AsyncIterableValue<TInput_>,
        ) => IAsyncCollection<TInput_>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput | TExtended> {
        const fillCollections = this.makeCollection(this.fillItems);
        const fillSize = await fillCollections.size();
        const size = await this.collection.size();
        const repeat = Math.floor((this.maxLength - size) / fillSize);
        let resultCollection: IAsyncCollection<TInput | TExtended> =
            this.makeCollection<TInput | TExtended>([]);
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

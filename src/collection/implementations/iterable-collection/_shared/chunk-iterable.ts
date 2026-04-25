/**
 * @module Collection
 */

import { type ICollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class ChunkIterable<TInput> implements Iterable<ICollection<TInput>> {
    constructor(
        private collection: ICollection<TInput>,
        private chunkSize: number,
        private readonly makeCollection: <TInput_>(
            iterable: Iterable<TInput_>,
        ) => ICollection<TInput_>,
    ) {}

    *[Symbol.iterator](): Iterator<ICollection<TInput>> {
        const array: Array<TInput> = [];
        let currentChunkSize = 0;
        let isFirstIteration = true;
        for (const item of this.collection) {
            currentChunkSize %= this.chunkSize;
            const isFilled = currentChunkSize === 0;
            if (!isFirstIteration && isFilled) {
                yield this.makeCollection(array);
                array.length = 0;
            }
            array.push(item);
            currentChunkSize++;
            isFirstIteration = false;
        }
        const hasRest = currentChunkSize !== 0;
        if (hasRest) {
            yield this.makeCollection(array);
        }
    }
}

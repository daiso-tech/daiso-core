/**
 * @module Collection
 */

import type { IAsyncCollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class AsyncShuffleIterable<TInput> implements AsyncIterable<TInput> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private readonly mathRandom: () => number,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
        const newArray = [...(await this.collection.toArray())];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(this.mathRandom() * (i + 1));
            const temp = newArray[i];
            if (newArray[j] !== undefined) {
                newArray[i] = newArray[j];
            }
            if (temp !== undefined) {
                newArray[j] = temp;
            }
        }
        yield* newArray;
    }
}

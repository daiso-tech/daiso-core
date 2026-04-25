/**
 * @module Collection
 */

import { type IAsyncCollection } from "@/collection/contracts/_module.js";
import { type AsyncIterableValue } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncRepeatIterable<TInput> implements AsyncIterable<TInput> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private amount: number,
        private makeAsyncCollection: <TInput_>(
            iterable: AsyncIterableValue<TInput_>,
        ) => IAsyncCollection<TInput_>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
        let collection = this.makeAsyncCollection<TInput>([]);
        for (let index = 0; index < this.amount; index++) {
            collection = collection.append(this.collection);
        }
        yield* collection;
    }
}

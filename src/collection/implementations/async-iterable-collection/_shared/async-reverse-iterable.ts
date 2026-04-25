/**
 * @module Collection
 */

import { type IAsyncCollection } from "@/collection/contracts/_module.js";
import { type AsyncIterableValue } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncReverseIterable<TInput> implements AsyncIterable<TInput> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private chunkSize: number,

        private makeCollection: <TInput_>(
            iterable: AsyncIterableValue<TInput_>,
        ) => IAsyncCollection<TInput_>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
        yield* await this.collection
            .chunk(this.chunkSize)
            .map(async (item) =>
                this.makeCollection([...(await item.toArray())].reverse()),
            )
            .reduce(
                (collection, item) => collection.prepend(item),
                this.makeCollection<TInput>([]),
            );
    }
}

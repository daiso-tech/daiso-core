/**
 * @module Collection
 */

import {
    type AsyncPredicate,
    type IAsyncCollection,
} from "@/collection/contracts/_module.js";
import {
    resolveInvokable,
    type AsyncIterableValue,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncChunkWhileIterable<TInput>
    implements AsyncIterable<IAsyncCollection<TInput>>
{
    constructor(
        private collection: IAsyncCollection<TInput>,
        private predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,

        private makeCollection: <TInput_>(
            iterable: AsyncIterableValue<TInput_>,
        ) => IAsyncCollection<TInput_>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<IAsyncCollection<TInput>> {
        const array: Array<TInput> = [];
        for await (const [index, item] of this.collection.entries()) {
            if (index === 0) {
                array.push(item);
            } else if (
                await resolveInvokable(this.predicateFn)(
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

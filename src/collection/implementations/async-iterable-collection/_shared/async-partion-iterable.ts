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
export class AsyncPartionIterable<TInput>
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
        const arrayA: Array<TInput> = [];
        const arrayB: Array<TInput> = [];
        for await (const [index, item] of this.collection.entries()) {
            if (
                await resolveInvokable(this.predicateFn)(
                    item,
                    index,
                    this.collection,
                )
            ) {
                arrayA.push(item);
            } else {
                arrayB.push(item);
            }
        }
        yield this.makeCollection(arrayA);
        yield this.makeCollection(arrayB);
    }
}

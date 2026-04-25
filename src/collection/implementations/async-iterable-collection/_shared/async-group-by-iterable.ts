/**
 * @module Collection
 */

import {
    type AsyncMap,
    type IAsyncCollection,
} from "@/collection/contracts/_module.js";
import {
    resolveInvokable,
    type AsyncIterableValue,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncGroupByIterable<TInput, TOutput = TInput>
    implements AsyncIterable<[TOutput, IAsyncCollection<TInput>]>
{
    constructor(
        private collection: IAsyncCollection<TInput>,
        private selectFn: AsyncMap<
            TInput,
            IAsyncCollection<TInput>,
            TOutput
        > = (item) => item as unknown as TOutput,

        private makeCollection: <TInput_>(
            iterable: AsyncIterableValue<TInput_>,
        ) => IAsyncCollection<TInput_>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<
        [TOutput, IAsyncCollection<TInput>]
    > {
        const map = new Map<TOutput, Array<TInput>>();
        for await (const [index, item] of this.collection.entries()) {
            const key = await resolveInvokable(this.selectFn)(
                item,
                index,
                this.collection,
            );
            let array = map.get(key);
            if (array === undefined) {
                array = [];
                map.set(key, array);
            }
            array.push(item);
            map.set(key, array);
        }
        yield* this.makeCollection(map).map<
            [TOutput, IAsyncCollection<TInput>]
        >(([key, value]) => [key, this.makeCollection(value)]);
    }
}

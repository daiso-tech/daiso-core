/**
 * @module Collection
 */

import {
    type IAsyncCollection,
    type CrossJoinResult,
} from "@/collection/contracts/_module.js";
import {
    resolveAsyncIterableValue,
    type AsyncIterableValue,
    isAsyncIterable,
    isIterable,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncCrossJoinIterable<TInput, TExtended>
    implements AsyncIterable<CrossJoinResult<TInput, TExtended>>
{
    constructor(
        private collection: IAsyncCollection<TInput>,
        private iterable: AsyncIterableValue<TExtended>,
        private makeCollection: <TInput_>(
            iterable_: AsyncIterableValue<TInput_>,
        ) => IAsyncCollection<TInput_>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<
        CrossJoinResult<TInput, TExtended>
    > {
        for await (const itemA of this.collection) {
            for await (const itemB of resolveAsyncIterableValue(
                this.iterable,
            )) {
                let collection = this.makeCollection<TInput | TExtended>([]);
                if (
                    isIterable<TInput | TExtended>(itemA) ||
                    isAsyncIterable<TInput | TExtended>(itemA)
                ) {
                    collection = collection.append(itemA);
                } else {
                    collection = collection.append([itemA]);
                }
                if (
                    isIterable<TInput | TExtended>(itemB) ||
                    isAsyncIterable<TInput | TExtended>(itemB)
                ) {
                    collection = collection.append(itemB);
                } else {
                    collection = collection.append([itemB]);
                }
                yield (await collection.toArray()) as CrossJoinResult<
                    TInput,
                    TExtended
                >;
            }
        }
    }
}

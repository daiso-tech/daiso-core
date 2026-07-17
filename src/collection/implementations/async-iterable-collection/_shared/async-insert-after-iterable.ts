/**
 * @module Collection
 */

import {
    type AsyncPredicate,
    type IAsyncCollection,
} from "@/collection/contracts/_module.js";
import {
    resolveAsyncIterableValue,
    resolveInvokable,
    type AsyncIterableValue,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncInsertAfterIterable<
    TInput,
    TExtended,
> implements AsyncIterable<TInput | TExtended> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
        private iterable: AsyncIterableValue<TInput | TExtended>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput | TExtended> {
        let hasMatched = false,
            index = 0;
        for await (const item of this.collection) {
            yield item;
            if (
                !hasMatched &&
                (await resolveInvokable(this.predicateFn)(
                    item,
                    index,
                    this.collection,
                ))
            ) {
                yield* resolveAsyncIterableValue(this.iterable);
                hasMatched = true;
            }
            index++;
        }
    }
}

/**
 * @module Collection
 */

import {
    type AsyncPredicate,
    type IAsyncCollection,
} from "@/collection/contracts/_module.js";
import { resolveInvocable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncFilterIterable<
    TInput,
    TOutput extends TInput,
> implements AsyncIterable<TOutput> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private predicateFn: AsyncPredicate<
            TInput,
            IAsyncCollection<TInput>,
            TOutput
        >,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TOutput> {
        for await (const [index, item] of this.collection.entries()) {
            if (
                await resolveInvocable(this.predicateFn)(
                    item,
                    index,
                    this.collection,
                )
            ) {
                yield item as TOutput;
            }
        }
    }
}

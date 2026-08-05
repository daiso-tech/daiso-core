/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module.js";

import type {
    AsyncPredicate,
    IAsyncCollection,
} from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class AsyncTakeUntilIterable<TInput> implements AsyncIterable<TInput> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
        for await (const [index, item] of this.collection.entries()) {
            if (
                await resolveInvocable(this.predicateFn)(
                    item,
                    index,
                    this.collection,
                )
            ) {
                break;
            }
            yield item;
        }
    }
}

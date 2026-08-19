/**
 * @module Collection
 */

import {
    resolveAsyncIterableValue,
    resolveInvocable,
} from "@/utilities/_module.js";

import type {
    AsyncPredicate,
    IAsyncCollection,
} from "@/collection/contracts/_module.js";
import type { AsyncIterableValue } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncInsertBeforeIterable<
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
            if (
                !hasMatched &&
                (await resolveInvocable(this.predicateFn)(
                    item,
                    index,
                    this.collection,
                ))
            ) {
                yield* resolveAsyncIterableValue(this.iterable);
                hasMatched = true;
            }
            yield item;
            index++;
        }
    }
}

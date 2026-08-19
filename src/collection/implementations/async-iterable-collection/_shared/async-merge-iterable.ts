/**
 * @module Collection
 */

import { isIterable, resolveAsyncIterableValue } from "@/utilities/_module.js";

import type { AsyncIterableValue } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncMergeIterable<TInput> implements AsyncIterable<TInput> {
    constructor(
        private readonly iterables: AsyncIterableValue<
            AsyncIterableValue<TInput>
        >,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
        if (isIterable(this.iterables)) {
            for (const iterable of this.iterables) {
                yield* resolveAsyncIterableValue(iterable);
            }
        } else {
            for await (const iterable of resolveAsyncIterableValue(
                this.iterables,
            )) {
                yield* resolveAsyncIterableValue(iterable);
            }
        }
    }
}

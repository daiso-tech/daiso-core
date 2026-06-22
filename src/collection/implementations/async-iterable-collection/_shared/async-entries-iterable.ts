/**
 * @module Collection
 */

import {
    resolveAsyncIterableValue,
    type AsyncIterableValue,
} from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncEntriesIterable<TInput> implements AsyncIterable<
    [number, TInput]
> {
    constructor(private iterable: AsyncIterableValue<TInput>) {}

    async *[Symbol.asyncIterator](): AsyncIterator<[number, TInput]> {
        let index = 0;
        for await (const item of resolveAsyncIterableValue(this.iterable)) {
            yield [index, item];
            index++;
        }
    }
}

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
export class AsyncZipIterable<TInput, TExtended> implements AsyncIterable<
    [TInput, TExtended]
> {
    constructor(
        private iterableA: AsyncIterableValue<TInput>,
        private iterableB: AsyncIterableValue<TExtended>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<[TInput, TExtended]> {
        const iteratorA = resolveAsyncIterableValue(this.iterableA)[
            Symbol.asyncIterator
        ]();

        const iteratorB = resolveAsyncIterableValue(this.iterableB)[
            Symbol.asyncIterator
        ]();

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            const itemA = await iteratorA.next(),
                itemB = await iteratorB.next();
            if (itemA.done === true || itemB.done === true) {
                break;
            }
            yield [itemA.value, itemB.value];
        }
    }
}

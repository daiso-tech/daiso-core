/**
 * @module Collection
 */

import {
    type AsyncMap,
    type IAsyncCollection,
} from "@/collection/contracts/_module.js";
import { resolveInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncCountByIterable<
    TInput,
    TOutput = TInput,
> implements AsyncIterable<[TOutput, number]> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private callback: AsyncMap<
            TInput,
            IAsyncCollection<TInput>,
            TOutput
        > = (item) => item as unknown as TOutput,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<[TOutput, number]> {
        const map = new Map<TOutput, number>();
        for await (const [index, item] of this.collection.entries()) {
            const key = await resolveInvokable(this.callback)(
                item,
                index,
                this.collection,
            );
            if (!map.has(key)) {
                map.set(key, 0);
            }
            const counter = map.get(key);
            if (counter !== undefined) {
                map.set(key, counter + 1);
            }
        }
        yield* map;
    }
}

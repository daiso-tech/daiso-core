/**
 * @module Collection
 */

import { type IAsyncCollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class AsyncSlidingIteralbe<TInput> implements AsyncIterable<
    IAsyncCollection<TInput>
> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private chunkSize: number,
        private step: number,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<IAsyncCollection<TInput>> {
        if (this.step <= 0) {
            return;
        }
        const size = await this.collection.size();

        for (let index = 0; index < size; index += this.step) {
            const start = index;
            const end = index + this.chunkSize;

            yield this.collection.slice(start, end);

            if (end >= size) {
                break;
            }
        }
    }
}

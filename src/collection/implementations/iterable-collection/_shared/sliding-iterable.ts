/**
 * @module Collection
 */

import type { ICollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class SlidingIteralbe<TInput> implements Iterable<ICollection<TInput>> {
    constructor(
        private collection: ICollection<TInput>,
        private chunkSize: number,
        private step: number,
    ) {}

    *[Symbol.iterator](): Iterator<ICollection<TInput>> {
        if (this.step <= 0) {
            return;
        }
        const size = this.collection.size();

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

/**
 * @module Collection
 */

import type { ICollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class SliceIterable<TInput> implements Iterable<TInput> {
    constructor(
        private collection: ICollection<TInput>,
        private start: number | undefined,
        private end: number | undefined,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        const size = this.collection.size();
        let { start, end } = this;
        if (start === undefined) {
            start = 0;
        }
        if (end === undefined) {
            end = size;
        }
        if (start < 0) {
            start = size + start;
        }
        if (end < 0) {
            end = size + end;
        }
        yield* this.collection.filter((_item, index) => {
            return start <= index && index < end;
        });
    }
}

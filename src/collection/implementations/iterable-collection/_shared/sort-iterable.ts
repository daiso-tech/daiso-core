/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module.js";

import type { Comparator } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class SortIterable<TInput> implements Iterable<TInput> {
    constructor(
        private iterable: Iterable<TInput>,
        private comparator?: Comparator<TInput>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        if (this.comparator === undefined) {
            yield* [...this.iterable].sort();
            return;
        }
        yield* [...this.iterable].sort(resolveInvocable(this.comparator));
    }
}

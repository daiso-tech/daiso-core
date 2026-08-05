/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module.js";

import type { ICollection, Map } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class UniqueIterable<TInput, TOutput> implements Iterable<TInput> {
    constructor(
        private collection: ICollection<TInput>,
        private callback: Map<TInput, ICollection<TInput>, TOutput> = (item) =>
            item as unknown as TOutput,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        const set = new Set<TOutput>([]);

        for (const [index, item] of this.collection.entries()) {
            const item_ = resolveInvocable(this.callback)(
                item,
                index,
                this.collection,
            );
            if (!set.has(item_)) {
                yield item;
            }
            set.add(item_);
        }
    }
}

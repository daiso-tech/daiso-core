/**
 * @module Collection
 */

import { isIterable } from "@/utilities/_module.js";

import type { Collapse, ICollection } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class CollapseIterable<TInput> implements Iterable<Collapse<TInput>> {
    constructor(private collection: ICollection<TInput>) {}

    *[Symbol.iterator](): Iterator<Collapse<TInput>> {
        for (const item of this.collection) {
            if (isIterable<TInput>(item)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                yield* item as any;
            } else {
                yield item as Collapse<TInput>;
            }
        }
    }
}

/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module.js";

import type { ICollection, Map } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class GroupByIterable<TInput, TOutput = TInput> implements Iterable<
    [TOutput, ICollection<TInput>]
> {
    constructor(
        private collection: ICollection<TInput>,
        private selectFn: Map<TInput, ICollection<TInput>, TOutput> = (item) =>
            item as unknown as TOutput,

        private makeCollection: <TInput_>(
            iterable: Iterable<TInput_>,
        ) => ICollection<TInput_>,
    ) {}

    *[Symbol.iterator](): Iterator<[TOutput, ICollection<TInput>]> {
        const map = new Map<TOutput, Array<TInput>>();
        for (const [index, item] of this.collection.entries()) {
            const key = resolveInvocable(this.selectFn)(
                item,
                index,
                this.collection,
            );
            let array = map.get(key);
            if (array === undefined) {
                array = [];
                map.set(key, array);
            }
            array.push(item);
            map.set(key, array);
        }
        yield* this.makeCollection(map).map<[TOutput, ICollection<TInput>]>(
            ([key, value]) => [key, this.makeCollection(value)],
        );
    }
}

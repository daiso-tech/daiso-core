/**
 * @module Collection
 */

import { resolveIterableValue } from "@/utilities/_module.js";

import type { IterableValue } from "@/utilities/_module.js";

/**
 * @internal
 */
export class MergeIterable<TInput> implements Iterable<TInput> {
    constructor(private iterables: IterableValue<IterableValue<TInput>>) {}

    *[Symbol.iterator](): Iterator<TInput> {
        for (const iterable of resolveIterableValue(this.iterables)) {
            yield* resolveIterableValue(iterable);
        }
    }
}

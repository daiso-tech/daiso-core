/**
 * @module Collection
 */

import { type ICollection, type Tap } from "@/collection/contracts/_module.js";
import { resolveInvocable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class TapIterable<TInput> implements Iterable<TInput> {
    constructor(
        private collection: ICollection<TInput>,
        private callback: Tap<ICollection<TInput>>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        resolveInvocable(this.callback)(this.collection);
        yield* this.collection;
    }
}

/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module.js";

import type { ICollection, Modifier } from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class WhenIterable<TInput, TExtended> implements Iterable<
    TInput | TExtended
> {
    constructor(
        private collection: ICollection<TInput>,
        private condition: () => boolean,
        private callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput | TExtended> {
        if (this.condition()) {
            yield* resolveInvocable(this.callback)(this.collection);
            return;
        }
        yield* this.collection as ICollection<TInput | TExtended>;
    }
}

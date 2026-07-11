/**
 * @module Collection
 */

import {
    type ICollection,
    type Modifier,
} from "@/collection/contracts/_module.js";
import { resolveInvokable } from "@/utilities/_module.js";

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
            yield* resolveInvokable(this.callback)(this.collection);
            return;
        }
        yield* this.collection as ICollection<TInput | TExtended>;
    }
}

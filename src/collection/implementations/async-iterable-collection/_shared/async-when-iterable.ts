/**
 * @module Collection
 */

import {
    type AsyncModifier,
    type IAsyncCollection,
} from "@/collection/contracts/_module.js";
import { resolveInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncWhenIterable<TInput, TExtended> implements AsyncIterable<
    TInput | TExtended
> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private condition: () => boolean | PromiseLike<boolean>,
        private callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput | TExtended> {
        if (await this.condition()) {
            yield* await resolveInvokable(this.callback)(this.collection);
            return;
        }
        yield* this.collection as IAsyncCollection<TInput | TExtended>;
    }
}

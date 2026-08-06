/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module.js";

import type {
    AsyncTap,
    IAsyncCollection,
} from "@/collection/contracts/_module.js";

/**
 * @internal
 */
export class AsyncTapIterable<TInput> implements AsyncIterable<TInput> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private callback: AsyncTap<IAsyncCollection<TInput>>,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
        await resolveInvocable(this.callback)(this.collection);
        yield* this.collection;
    }
}

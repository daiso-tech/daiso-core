/**
 * @module Collection
 */

import {
    type AsyncPredicate,
    type AsyncMap,
    type IAsyncCollection,
} from "@/collection/contracts/_module.js";
import { resolveInvokable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class AsyncChangeIterable<
    TInput,
    TFilterOutput extends TInput,
    TMapOutput,
> implements AsyncIterable<TInput | TFilterOutput | TMapOutput> {
    constructor(
        private collection: IAsyncCollection<TInput>,
        private predicateFn: AsyncPredicate<
            TInput,
            IAsyncCollection<TInput>,
            TFilterOutput
        >,
        private mapFn: AsyncMap<
            TFilterOutput,
            IAsyncCollection<TInput>,
            TMapOutput
        >,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<
        TInput | TFilterOutput | TMapOutput
    > {
        for await (const [index, item] of this.collection.entries()) {
            if (
                await resolveInvokable(this.predicateFn)(
                    item,
                    index,
                    this.collection,
                )
            ) {
                yield resolveInvokable(this.mapFn)(
                    item as TFilterOutput,
                    index,
                    this.collection,
                );
            } else {
                yield item;
            }
        }
    }
}

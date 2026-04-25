/**
 * @module Collection
 */

import {
    type CrossJoinResult,
    type ICollection,
} from "@/collection/contracts/_module.js";
import { isIterable } from "@/utilities/_module.js";

/**
 * @internal
 */
export class CrossJoinIterable<TInput, TExtended = TInput>
    implements Iterable<CrossJoinResult<TInput, TExtended>>
{
    constructor(
        private readonly collection: ICollection<TInput>,
        private readonly iterable: Iterable<TExtended>,
        private readonly makeCollection: <TInput_>(
            iterable_: Iterable<TInput_>,
        ) => ICollection<TInput_>,
    ) {}

    *[Symbol.iterator](): Iterator<CrossJoinResult<TInput, TExtended>> {
        for (const itemA of this.collection) {
            for (const itemB of this.iterable) {
                let collection = this.makeCollection<TInput | TExtended>([]);
                if (isIterable<TInput | TExtended>(itemA)) {
                    collection = collection.append(itemA);
                } else {
                    collection = collection.append([itemA]);
                }
                if (isIterable<TInput | TExtended>(itemB)) {
                    collection = collection.append(itemB);
                } else {
                    collection = collection.append([itemB]);
                }
                yield collection.toArray() as CrossJoinResult<
                    TInput,
                    TExtended
                >;
            }
        }
    }
}

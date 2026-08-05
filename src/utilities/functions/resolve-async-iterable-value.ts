/**
 * @module Utilities
 */

import { arrayLikeToIterable } from "@/utilities/functions/array-like-to-iterable.js";
import { isArrayLike } from "@/utilities/functions/is-array-like.js";
import { isIterable } from "@/utilities/functions/is-iterable.js";
import { iterableToAsyncIterable } from "@/utilities/functions/iterable-to-async-iterable.js";

import type { AsyncIterableValue } from "@/utilities/types/_module.js";

/**
 * @internal
 */
export function resolveAsyncIterableValue<TItem>(
    iterableValue: AsyncIterableValue<TItem>,
): AsyncIterable<TItem> {
    if (isIterable(iterableValue)) {
        return iterableToAsyncIterable(iterableValue);
    }

    if (isArrayLike(iterableValue)) {
        return iterableToAsyncIterable(arrayLikeToIterable(iterableValue));
    }

    return iterableValue;
}

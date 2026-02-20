/**
 * @module Utilities
 */

/**
 * @internal
 */
export function iterableToAsyncIterable<TItem>(
    iterable: Iterable<TItem>,
): AsyncIterable<TItem> {
    return {
        async *[Symbol.asyncIterator](): AsyncIterator<TItem> {
            for (const item of iterable) {
                yield await Promise.resolve(item);
            }
        },
    };
}

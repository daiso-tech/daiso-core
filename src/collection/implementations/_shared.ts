/**
 * @module Collection
 */

/**
 * @internal
 */
class RangeIterable implements Iterable<number> {
    constructor(
        private from: number,
        private to: number,
    ) {}

    *[Symbol.iterator](): Iterator<number> {
        for (let i = this.from; i <= this.to; i++) {
            yield i;
        }
    }
}
/**
 * The `range` function return a {@link Iterable | `Iterable`} of numbers, starting from `from`,increments by 1 and stops at `to`.
 * @example
 * ```ts
 * import { ListCollection, range } from "eridu-tech/collection";
 *
 * const collection = new ListCollection(range(1, 10))
 * collection.toArray();
 * // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * ```
 *
 * IMPORT_PATH: `"eridu-tech/collection"`
 * @group Utilities
 */
export function range(from: number, to: number): Iterable<number> {
    return new RangeIterable(from, to);
}

/**
 * @module Collection
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type AsyncReduce,
    type CrossJoinResult,
    type AsyncPredicate,
    type AsyncForEach,
    type AsyncMap,
    type AsyncModifier,
    type Tap,
    type AsyncTransform,
    type Comparator,
    type EnsureRecord,
    type EnsureMap,
} from "@/collection/contracts/_shared/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ItemNotFoundCollectionError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type MultipleItemsFoundCollectionError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type EmptyCollectionError,
} from "@/collection/contracts/collection.errors.js";
import {
    type AsyncLazyable,
    type AsyncIterableValue,
} from "@/utilities/_module.js";

/**
 * Collapses 1 layer of nested array, iterable, async iterable, or async-collection types into their element type.
 * If `TValue` is an `Array`, `ArrayLike`, `Iterable`, `AsyncIterable`, or `IAsyncCollection`, the result is
 * the inner item type. Otherwise `TValue` is returned as-is.
 *
 * @template TValue - The value type to collapse.
 *
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 */
export type AsyncCollapse<TValue> = TValue extends string
    ? string
    : TValue extends
            | Array<infer TItem>
            | AsyncIterableValue<infer TItem>
            | IAsyncCollection<infer TItem>
      ? TItem
      : TValue;

/**
 * The `IAsyncCollection` contract offers a fluent and efficient approach to working with {@link AsyncIterable | `AsyncIterable`} objects.
 * `IAsyncCollection` is immutable.
 *
 * IMPORT_PATH: `"@daiso-tech/core/collection/contracts"`
 * @group Contracts
 */
export interface IAsyncCollection<TInput = unknown>
    extends AsyncIterable<TInput> {
    /**
     * The `toIterator` method converts the collection to a new iterator.
     */
    toIterator(): AsyncIterator<TInput, void>;

    /**
     * The `entries` returns an IAsyncCollection of key, value pairs for every entry in the collection.
     */
    entries(): IAsyncCollection<[number, TInput]>;

    /**
     * The `keys` method returns an IAsyncCollection of keys in the collection.
     */
    keys(): IAsyncCollection<number>;

    /**
     * The `copy` method returns a copy of the collection.
     */
    copy(): IAsyncCollection<TInput>;

    /**
     * The `filter` method filters the collection using `predicateFn`, keeping only those items that pass `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6])
     *     .filter(item => 2 < item && item < 5)
     *     .toArray();
     *   // [3, 4]
     * }
     * ```
     */
    filter<TOutput extends TInput>(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): IAsyncCollection<TOutput>;

    /**
     * The `validate` method filters all items that matches the `schema` and transforms them afterwards.
     * The `schema` can be any [standard schema](https://standardschema.dev/) compliant object.
     */
    validate<TOutput>(
        schema: StandardSchemaV1<TInput, TOutput>,
    ): IAsyncCollection<TOutput>;

    /**
     * The `reject` method filters the collection using `predicateFn`, keeping only those items that not pass `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6])
     *     .reject(item => 2 < item && item < 5)
     *     .toArray();
     *   // [1, 2, 5, 6]
     * }
     * ```
     */
    reject<TOutput extends TInput>(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): IAsyncCollection<Exclude<TInput, TOutput>>;

    /**
     * The `map` method iterates through the collection and passes each item to `mapFn`.
     * The `mapFn` is free to modify the item and return it, thus forming a new collection of modified items.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .map(item => item * 2)
     *     .toArray();
     *   // [2, 4, 6, 8, 10]
     * }
     * ```
     */
    map<TOutput>(
        mapFn: AsyncMap<TInput, IAsyncCollection<TInput>, TOutput>,
    ): IAsyncCollection<TOutput>;

    /**
     * The `reduce` method executes ` reduceFn ` function on each item of the array, passing in the return value from the calculation on the preceding item.
     * The final result of running the reducer across all items of the array is a single value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3])
     *     .reduce((sum, item) => sum + item);
     *   // 6
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "c"])
     *     .entries()
     *     .reduce(
     *       (record, [key, value]) => ({
     *         ...record,
     *         [key]: value
     *       }),
     *       {} as Record<number, string>
     *     );
     *   // { 0: "a", 1: "b", 2: "c" }
     * }
     * ```
     */
    reduce(
        reduceFn: AsyncReduce<TInput, IAsyncCollection<TInput>, TInput>,
    ): Promise<TInput>;
    reduce(
        reduceFn: AsyncReduce<TInput, IAsyncCollection<TInput>, TInput>,
        // eslint-disable-next-line @typescript-eslint/unified-signatures
        initialValue: TInput,
    ): Promise<TInput>;
    reduce<TOutput>(
        reduceFn: AsyncReduce<TInput, IAsyncCollection<TInput>, TOutput>,
        initialValue: TOutput,
    ): Promise<TOutput>;

    /**
     * The `join` method joins the collection's items with ` separator `. An error will be thrown when if a none string item is encounterd.
     * @throws {TypeError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .map(item => item.toString())
     *     .join();
     *   // "1,2,3,4"
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .map(item => item.toString())
     *     .join("_");
     *   // "1_2_3_4"
     * }
     * ```
     */
    join(separator?: string): Promise<Extract<TInput, string>>;

    /**
     * The `collapse` method collapses a collection of iterables into a single, flat collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number[]>): Promise<void> {
     *   await collection
     *     .append([[1, 2], [3, 4]])
     *     .collapse()
     *     .toArray();
     *   // [1, 2, 3, 4]
     * }
     * ```
     */
    collapse(): IAsyncCollection<AsyncCollapse<TInput>>;

    /**
     * The `flatMap` method returns a new array formed by applying `mapFn` to each item of the array, and then collapses the result by one level.
     * It is identical to a `map` method followed by a `collapse` method.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string[]>): Promise<void> {
     *   await collection
     *     .append([["a", "b"], ["c", "d"]])
     *     .flatMap(item => [item.length, ...item])
     *     .toArray();
     *   // [2, "a", "b", 2, "c", "d"]
     * }
     * ```
     */
    flatMap<TOutput>(
        mapFn: AsyncMap<TInput, IAsyncCollection<TInput>, Iterable<TOutput>>,
    ): IAsyncCollection<TOutput>;

    /**
     * The `change` method changes only the items that passes `predicateFn` using `mapFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .change(item => item % 2 === 0, item => item * 2)
     *     .toArray();
     *   // [1, 4, 3, 8, 5]
     * }
     * ```
     */
    change<TFilterOutput extends TInput, TMapOutput>(
        predicateFn: AsyncPredicate<
            TInput,
            IAsyncCollection<TInput>,
            TFilterOutput
        >,
        mapFn: AsyncMap<TFilterOutput, IAsyncCollection<TInput>, TMapOutput>,
    ): IAsyncCollection<TInput | TFilterOutput | TMapOutput>;

    /**
     * The `set` method changes a item by i>index` using `value`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .set(1, -1)
     *     .toArray();
     *   // [1, -1, 3, 4, 5]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .set(1, (prevValue) => prevValue - 2)
     *     .toArray();
     *   // [1, 0, 3, 4, 5]
     * }
     * ```
     */
    set(
        index: number,
        value: TInput | AsyncMap<TInput, IAsyncCollection<TInput>, TInput>,
    ): IAsyncCollection<TInput>;

    /**
     * The `get` method returns the item by index. If the item is not found null will returned.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *    collection = collection.append([1, 4, 2, 8, -2]);
     *
     *    // Will be 2
     *    await collection.get(2);
     *
     *    // Will be null
     *    await collection.get(5);
     * }
     * ```
     */
    get(index: number): Promise<TInput | null>;

    /**
     * The `getOrFail` method returns the item by index. If the item is not found an error will be thrown.
     * @throws {ItemNotFoundCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   collection = collection.append([1, 4, 2, 8, -2]);
     *
     *   // Will be 2
     *   await collection.getOrFail(2);
     *
     *   // An error will thrown
     *   await collection.getOrFail(5);
     * }
     * ```
     */
    getOrFail(index: number): Promise<TInput>;

    /**
     * The `page` method returns a new collection containing the items that would be present on ` page ` with custom ` pageSize `.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6, 7, 8, 9])
     *     .page(2, 3)
     *     .toArray();
     *   // [4, 5, 6]
     * }
     * ```
     */
    page(page: number, pageSize: number): IAsyncCollection<TInput>;

    /**
     * The `sum` method returns the sum of all items in the collection. If the collection includes other than number items an error will be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3])
     *     .sum();
     *   // 6
     * }
     * ```
     */
    sum(): Promise<Extract<TInput, number>>;

    /**
     * The `average` method returns the average of all items in the collection. If the collection includes other than number items an error will be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3])
     *     .average();
     *   // 2
     * }
     * ```
     */
    average(): Promise<Extract<TInput, number>>;

    /**
     * The `median` method returns the median of all items in the collection. If the collection includes other than number items an error will be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3])
     *     .median();
     *   // 2
     * }
     * ```
     */
    median(): Promise<Extract<TInput, number>>;

    /**
     * The `min` method returns the min of all items in the collection. If the collection includes other than number items an error will be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3])
     *     .min();
     *   // 1
     * }
     * ```
     */
    min(): Promise<Extract<TInput, number>>;

    /**
     * The `max` method returns the max of all items in the collection. If the collection includes other than number items an error will be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3])
     *     .max();
     *   // 3
     * }
     * ```
     */
    max(): Promise<Extract<TInput, number>>;

    /**
     * The `percentage` method may be used to quickly determine the percentage of items in the collection that pass `predicateFn`.
     * @throws {EmptyCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 1, 2, 2, 2, 3])
     *     .percentage(value => value === 1);
     *   // 33.333
     * }
     * ```
     */
    percentage(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<number>;

    /**
     * The `some` method determines whether at least one item in the collection matches `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([0, 1, 2, 3, 4, 5])
     *     .some(item => item === 1);
     *   // true
     * }
     * ```
     */
    some<TOutput extends TInput>(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<boolean>;

    /**
     * The `every` method determines whether all items in the collection matches `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([0, 1, 2, 3, 4, 5])
     *     .every(item => item < 6);
     *   // true
     * }
     * ```
     */
    every<TOutput extends TInput>(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<boolean>;

    /**
     * The `take` method takes the first `limit` items.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([0, 1, 2, 3, 4, 5])
     *     .take(3)
     *     .toArray();
     *   // [0, 1, 2]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([0, 1, 2, 3, 4, 5])
     *     .take(-2)
     *     .toArray();
     *   // [0, 1, 2, 3]
     * }
     * ```
     */
    take(limit: number): IAsyncCollection<TInput>;

    /**
     * The `takeUntil` method takes items until `predicateFn` returns true.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .takeUntil(item => item >= 3)
     *     .toArray();
     *   // [1, 2]
     * }
     * ```
     */
    takeUntil(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): IAsyncCollection<TInput>;

    /**
     * The `takeWhile` method takes items until `predicateFn` returns false.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .takeWhile(item => item < 4)
     *     .toArray();
     *   // [1, 2, 3]
     * }
     * ```
     */
    takeWhile(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): IAsyncCollection<TInput>;

    /**
     * The `skip` method skips the first `offset` items.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
     *     .skip(4)
     *     .toArray();
     *   // [5, 6, 7, 8, 9, 10]
     * }
     * ```
     */
    skip(offset: number): IAsyncCollection<TInput>;

    /**
     * The `skipUntil` method skips items until `predicateFn` returns true.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .skipUntil(item => item >= 3)
     *     .toArray();
     *   // [3, 4]
     * }
     * ```
     */
    skipUntil(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): IAsyncCollection<TInput>;

    /**
     * The `skipWhile` method skips items until `predicateFn` returns false.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .skipWhile(item => item <= 3)
     *   .toArray();
     *   // [4]
     * }
     * ```
     */
    skipWhile(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): IAsyncCollection<TInput>;

    /**
     * The `when` method will execute `callback` when `condition` evaluates to true.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .when(true, collection => collection.append([-3]))
     *     .when(false, collection => collection.append([20]))
     *     .toArray();
     *   // [1, 2, 3, 4, -3]
     * }
     * ```
     */
    when<TExtended = TInput>(
        condition: boolean,
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `whenEmpty` method will execute `callback` when the collection is empty.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([])
     *     .whenEmpty(collection => collection.append([-3]))
     *     .toArray();
     *   // [-3]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1])
     *     .whenEmpty(collection => collection.append([-3]))
     *     .toArray();
     *   // [1]
     * }
     * ```
     */
    whenEmpty<TExtended = TInput>(
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `whenNot` method will execute `callback` when `condition` evaluates to false.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .whenNot(true, collection => collection.append([-3]))
     *     .whenNot(false, collection => collection.append([20]))
     *     .toArray();
     *   // [1, 2, 3, 4, 20]
     * }
     * ```
     */
    whenNot<TExtended = TInput>(
        condition: boolean,
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `whenNotEmpty` method will execute `callback` when the collection is not empty.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([])
     *     .whenNotEmpty(collection => collection.append([-3])).toArray();
     *   // []
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1])
     *     .whenNotEmpty(collection => collection.append([-3]))
     *     .toArray();
     *   // [1, -3]
     * }
     * ```
     */
    whenNotEmpty<TExtended = TInput>(
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `pipe` method passes the orignal collection to `callback` and returns the result from `callback`.
     * This method is useful when you want compose multiple smaller functions.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   function toNbrs<TInput>(
     *     collection: IAsyncCollection<TInput>,
     *   ): IAsyncCollection<number> {
     *     return collection
     *       .map((item) => Number(item))
     *       .reject((nbr) => Number.isNaN(nbr));
     *   }
     *   function nbrToStr(collection: IAsyncCollection<number>): number[] {
     *     return collection.repeat(2).toArray();
     *   }
     *   await collection
     *     .append([1, "2", "a", 1, 3, {}])
     *     .pipe(toNbrs)
     *     .then(nbrToStr);
     *   // [ 1, 2, 1, 3 ]
     * }
     * ```
     */
    pipe<TOutput = TInput>(
        callback: AsyncTransform<IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput>;

    /**
     * The `tap` method passes a copy of the original collection to `callback`, allowing you to do something with the items while not affecting the original collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6])
     *     .tap(collection => {
     *       collection
     *         .filter(value => value % 2 === 0)
     *         .forEach(value => console.log(value))
     *     })
     *     .toArray();
     *   // [1, 2, 3, 4, 5, 6]
     * }
     * ```
     */
    tap(callback: Tap<IAsyncCollection<TInput>>): IAsyncCollection<TInput>;

    /**
     * The `chunk` method breaks the collection into multiple, smaller collections of size `chunkSize`.
     * If `chunkSize` is not divisible with total number of items then the last chunk will contain the remaining items.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6, 7])
     *     .chunk(4)
     *     .map(chunk => chunk.toArray())
     *     .toArray();
     *   // [[1, 2, 3, 4], [5, 6, 7]]
     * }
     * ```
     */
    chunk(chunkSize: number): IAsyncCollection<IAsyncCollection<TInput>>;

    /**
     * The `chunkWhile` method breaks the collection into multiple, smaller collections based on the evaluation of `predicateFn`.
     * The chunk variable passed to the `predicateFn` may be used to inspect the previous item.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("AABBCCCD")
     *     .chunkWhile((value, index, chunk) => {
     *       return value === chunk.last();
     *     })
     *     .map(chunk => chunk.toArray())
     *     .toArray();
     *   //  [["A", "A"], ["B", "B"], ["C", "C", "C"], ["D"]]
     * }
     * ```
     */
    chunkWhile(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): IAsyncCollection<IAsyncCollection<TInput>>;

    /**
     * The `split` method breaks a collection evenly into `chunkAmount` of chunks.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .split(3)
     *     .map(chunk => chunk.toArray())
     *     .toArray();
     *   // [[1, 2], [3, 4], [5]]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6])
     *     .split(3)
     *     .map(chunk => chunk.toArray())
     *     .toArray();
     *   // [[1, 2], [3, 4], [5, 6]]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6, 7])
     *     .split(3)
     *     .map(chunk => chunk.toArray())
     *     .toArray();
     *   // [[1, 2, 7], [3, 4], [5, 6]]
     * }
     */
    split(chunkAmount: number): IAsyncCollection<IAsyncCollection<TInput>>;

    /**
     * The `partition` method is used to separate items that pass `predicateFn` from those that do not.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6])
     *     .partition(item => item < 3)
     *     .map(chunk => chunk.toArray())
     *     .toArray();
     *   // [[1, 2], [3, 4, 5, 6]]
     * }
     * ```
     */
    partition(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): IAsyncCollection<IAsyncCollection<TInput>>;

    /**
     * The `sliding` method returns a new collection of chunks representing a "sliding window" view of the items in the collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .sliding(2)
     *     .map(chunk => chunk.toArray())
     *     .toArray();
     *   // [[1, 2], [2, 3], [3, 4], [4, 5]]
     * }
     * ```
     */
    sliding(
        chunkSize: number,
        step?: number,
    ): IAsyncCollection<IAsyncCollection<TInput>>;

    /**
     * The `groupBy` method groups the collection's items by ` selectFn `.
     * By default the equality check occurs on the item.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "a", "a", "b", "b", "c"])
     *     .groupBy()
     *     .map(([key, collection]) => [key, collection.toArray()])
     *     .toArray();
     *   // [
     *   //  [
     *   //    "a",
     *   //    ["a", "a", "a"]
     *   //  ],
     *   //  [
     *   //    "b",
     *   //    ["b", "b"]
     *   //  ],
     *   //  [
     *   //    "c",
     *   //    ["c"]
     *   //  ]
     *   // ]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["alice@gmail.com", "bob@yahoo.com", "carlos@gmail.com"])
     *     .groupBy(item => item.split("@")[1])
     *     .map(([key, collection]) => [key, collection.toArray()])
     *     .toArray();
     *   // [
     *   //   [
     *   //     "gmail.com",
     *   //     ["alice@gmail.com", "carlos@gmail.com"]
     *   //   ],
     *   //   [
     *   //     "yahoo.com",
     *   //     ["bob@yahoo.com"]
     *   //   ]
     *   // ]
     * }
     * ```
     */
    groupBy<TOutput = TInput>(
        selectFn?: AsyncMap<TInput, IAsyncCollection<TInput>, TOutput>,
    ): IAsyncCollection<[TOutput, IAsyncCollection<TInput>]>;

    /**
     * The `countBy` method counts the occurrences of values in the collection by ` selectFn `.
     * By default the equality check occurs on the item.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *      .append(["a", "a", "a", "b", "b", "c"])
     *     .countBy()
     *     .map(([key, collection]) => [key, collection.toArray()])
     *     .toArray();
     *   // [
     *   //  ["a", 3],
     *   //  ["b", 2],
     *   //  ["c", 1]
     *   // ]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["alice@gmail.com", "bob@yahoo.com", "carlos@gmail.com"])
     *     .countBy(item => item.split("@")[1])
     *     .toArray();
     *   // [
     *   //   ["gmail.com", 2],
     *   //   ["yahoo.com", 1]
     *   // ]
     * }
     * ```
     */
    countBy<TOutput = TInput>(
        selectFn?: AsyncMap<TInput, IAsyncCollection<TInput>, TOutput>,
    ): IAsyncCollection<[TOutput, number]>;

    /**
     * The `unique` method removes all duplicate values from the collection by ` selectFn `.
     * By default the equality check occurs on the item.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * type Phone = {
     *   name: string;
     *   brand: string;
     *   type: string;
     * };
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<Phone>): Promise<void> {
     *   await collection
     *     .append([1, 1, 2, 2, 3, 4, 2])
     *     .unique()
     *     .toArray();
     *   // [1, 2, 3, 4]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([
     *       { name: "iPhone 6", brand: "Apple", type: "phone" },
     *       { name: "iPhone 5", brand: "Apple", type: "phone" },
     *       { name: "Apple Watch", brand: "Apple", type: "watch" },
     *       { name: "Galaxy S6", brand: "Samsung", type: "phone" },
     *       { name: "Galaxy Gear", brand: "Samsung", type: "watch" },
     *     ])
     *     .unique(item => item.brand)
     *     .toArray();
     *   // [
     *   //   { name: "iPhone 6", brand: "Apple", type: "phone" },
     *   //   { name: "Galaxy S6", brand: "Samsung", type: "phone" },
     *   // ]
     * }
     * ```
     */
    unique<TOutput = TInput>(
        selectFn?: AsyncMap<TInput, IAsyncCollection<TInput>, TOutput>,
    ): IAsyncCollection<TInput>;

    /**
     * The `difference` method will return the values in the original collection that are not present in `iterable`.
     * By default the equality check occurs on the item.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 2, 3, 4, 5])
     *     .difference([2, 4, 6, 8])
     *     .toArray();
     *   // [1, 3, 5]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * type Phone = {
     *   name: string;
     *   brand: string;
     *   type: string;
     * };
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<Phone>): Promise<void> {
     *   await collection
     *     .append([
     *       { name: "iPhone 6", brand: "Apple", type: "phone" },
     *       { name: "iPhone 5", brand: "Apple", type: "phone" },
     *       { name: "Apple Watch", brand: "Apple", type: "watch" },
     *       { name: "Galaxy S6", brand: "Samsung", type: "phone" },
     *       { name: "Galaxy Gear", brand: "Samsung", type: "watch" },
     *     ])
     *     .difference(
     *       [
     *         { name: "Apple Watch", brand: "Apple", type: "watch" },
     *       ],
     *       (product) => product.type
     *     )
     *     .toArray();
     *   // [
     *   //   { name: "iPhone 6", brand: "Apple", type: "phone" },
     *   //   { name: "iPhone 5", brand: "Apple", type: "phone" },
     *   //   { name: "Galaxy S6", brand: "Samsung", type: "phone" },
     *   // ]
     * }
     * ```
     */
    difference<TOutput = TInput>(
        iterable: AsyncIterableValue<TInput>,
        selectFn?: AsyncMap<TInput, IAsyncCollection<TInput>, TOutput>,
    ): IAsyncCollection<TInput>;

    /**
     * The `repeat` method will repeat the original collection `amount` times.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3])
     *     .repeat(3)
     *     .toArray();
     *   // [1, 2, 3,  1, 2, 3,  1, 2, 3]
     * }
     * ```
     */
    repeat(amount: number): IAsyncCollection<TInput>;

    /**
     * The `padStart` method pads this collection with `fillItems` until the resulting collection size reaches `maxLength`.
     * The padding is applied from the start of this collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padStart(10, "foo")
     *     .join("");
     *   // "foofoofabc"
     * }
     * ```
     * @example
     * ```ts
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padStart(6, "123465")
     *     .join("");
     *   // "123abc"
     * }
     * ```
     * @example
     * ```ts
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padStart(8, "0")
     *     .join("");
     *   // "00000abc"
     * }
     * ```
     * @example
     * ```ts
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padStart(1, "_")
     *     .join("");
     *   // "abc"
     * }
     * ```
     */
    padStart<TExtended = TInput>(
        maxLength: number,
        fillItems: AsyncIterableValue<TExtended>,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `padEnd` method pads this collection with `fillItems` until the resulting collection size reaches `maxLength`.
     * The padding is applied from the end of this collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padEnd(10, "foo")
     *     .join("");
     *   // "abcfoofoof"
     * }
     * ```
     * @example
     * ```ts
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padEnd(6, "123465")
     *     .join("");
     *   // "abc123"
     * }
     * ```
     * @example
     * ```ts
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padEnd(8, "0")
     *     .join("");
     *   // "abc00000"
     * }
     * ```
     * @example
     * ```ts
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append("abc")
     *     .padEnd(1, "_")
     *     .join("");
     *   // "abc"
     * }
     * ```
     */
    padEnd<TExtended = TInput>(
        maxLength: number,
        fillItems: AsyncIterableValue<TExtended>,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `slice` method creates porition of the original collection selected from `start` and `end`
     * where `start` and `end` (end not included) represent the index of items in the collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "c", "d", "e", "f"])
     *     .slice(3)
     *     .toArray();
     *   // ["d", "e", "f"]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "c", "d", "e", "f"])
     *     .slice(undefined, 2)
     *     .toArray();
     *   // ["a", "b"]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "c", "d", "e", "f"])
     *     .slice(2, 5)
     *     .toArray();
     *   // ["c", "d", "e"]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "c", "d", "e", "f"])
     *     .slice(-2)
     *     .toArray();
     *   // ["e", "f"]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "c", "d", "e", "f"])
     *     .slice(undefined, -2)
     *     .toArray();
     *   // ["a", "b", "c", "d"]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "c", "d", "e", "f"])
     *     .slice(-4, -2)
     *     .toArray();
     *   // ["c", "d"]
     * }
     * ```
     */
    slice(start?: number, end?: number): IAsyncCollection<TInput>;

    /**
     * The `prepend` method adds `iterable` to the beginning of the collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .prepend([-1, 20])
     *     .toArray();
     *   // [-1, 20, 1, 2, 3, 4, 5]
     * }
     * ```
     */
    prepend<TExtended = TInput>(
        iterable: AsyncIterableValue<TInput | TExtended>,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `append` method adds `iterable` to the end of the collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .append([-1, -2])
     *     .toArray();
     *   // [1, 2, 3, 4, 5, -1, -2,]
     * }
     * ```
     */
    append<TExtended = TInput>(
        iterable: AsyncIterableValue<TInput | TExtended>,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `insertBefore` method adds `iterable` before the first item that matches `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 2, 3, 4, 5])
     *     .insertBefore(item => item === 2, [-1, 20])
     *     .toArray();
     *   // [1, -1, 20, 2, 2, 3, 4, 5]
     * }
     * ```
     */
    insertBefore<TExtended = TInput>(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
        iterable: AsyncIterableValue<TInput | TExtended>,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `insertAfter` method adds `iterable` after the first item that matches `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 2, 3, 4, 5])
     *     .insertAfter(item => item === 2, [-1, 20])
     *     .toArray();
     *   // [1, 2, -1, 20, 2, 3, 4, 5]
     * }
     * ```
     */
    insertAfter<TExtended = TInput>(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
        iterable: AsyncIterableValue<TInput | TExtended>,
    ): IAsyncCollection<TInput | TExtended>;

    /**
     * The `crossJoin` method cross joins the collection's values among `iterables`, returning a Cartesian product with all possible permutations.
     * @example
     * ```ts
     * import { ICollection } from "@daiso-tech/core/collection/contracts";
     *
     * async function(): Promise<void> {
     *   await collection
     *     .append([1, 2])
     *     .cross(["a", "b"])
     *     .toArray();
     *   // [
     *   //  [1, "a"],
     *   //  [1, "b"],
     *   //  [2, "a"],
     *   //  [2, "b"],
     *   // ]
     * }
     * ```
     * @example
     * ```ts
     * import { ICollection } from "@daiso-tech/core/collection/contracts";
     *
     * async function(): Promise<void> {
     *   await collection
     *     .append([1, 2])
     *     .cross(["a", "b"])
     *     .cross(["I", "II"])
     *     .toArray();
     *   // [
     *   //  [1, "a", "I"],
     *   //  [1, "a", "II"],
     *   //  [1, "b", "I"],
     *   //  [1, "b", "II"],
     *   //  [2, "a", "I"],
     *   //  [2, "a", "II"],
     *   //  [2, "b", "I"],
     *   //  [2, "b", "II"],
     *   // ]
     * }
     * ```
     */
    crossJoin<TExtended>(
        iterable: AsyncIterableValue<TExtended>,
    ): IAsyncCollection<CrossJoinResult<TInput, TExtended>>;

    /**
     * The `zip` method merges together the values of `iterable` with the values of the collection at their corresponding index.
     * The returned collection has size of the shortest collection.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["Chair", "Desk"])
     *     .zip([100, 200])
     *     .toArray();
     *   // [["Chair", 100], ["Desk", 200]]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["Chair", "Desk", "Couch"])
     *     .zip([100, 200])
     *     .toArray();
     *   // [["Chair", 100], ["Desk", 200]]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["Chair", "Desk"])
     *     .zip([100, 200, 300])
     *     .toArray();
     *   // [["Chair", 100], ["Desk", 200]]
     * }
     * ```
     */
    zip<TExtended>(
        iterable: AsyncIterableValue<TExtended>,
    ): IAsyncCollection<[TInput, TExtended]>;

    /**
     * The `sort` method sorts the collection. You can provide a `comparator` function.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * type Person = {
     *   name: string;
     *   age: number;
     * };
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<Person>): Promise<void> {
     *   await collection
     *     .append([-1, 2, 4, 3])
     *     .sort()
     *     .toArray();
     *   // [-1, 2, 3, 4]
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([
     *       { name: "Anders", age: 30 },
     *       { name: "Joe", age: 20 },
     *       { name: "Hasan", age: 25 },
     *       { name: "Linda", age: 19 }
     *     ])
     *     .sort(({ age: ageA }, { age: ageB }) => ageA - ageB)
     *     .toArray();
     *   // [
     *   //   { name: "Linda", age: 19 }
     *   //   { name: "Joe", age: 20 },
     *   //   { name: "Hasan", age: 25 },
     *   //   { name: "Anders", age: 30 },
     *   // ]
     * }
     * ```
     */
    sort(comparator?: Comparator<TInput>): IAsyncCollection<TInput>;

    /**
     * The `reverse` method will reverse the order of the collection.
     * The reversing of the collection will be applied in chunks that are the size of ` chunkSize `.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([-1, 2, 4, 3])
     *     .reverse()
     *     .toArray();
     *   // [3, 4, 2, -1]
     * }
     * ```
     */
    reverse(chunkSize?: number): IAsyncCollection<TInput>;

    /**
     * The `shuffle` method randomly shuffles the items in the collection. You can provide a custom Math.random function by passing in `mathRandom`.
     */
    shuffle(mathRandom?: () => number): IAsyncCollection<TInput>;

    /**
     * The `first` method returns the first item in the collection that passes ` predicateFn `.
     * By default it will get the first item. If the collection is empty or no items passes ` predicateFn ` than null i returned.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .first();
     *   // 1
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .first(item => item > 2);
     *   // 3
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .first(item => item > 10);
     *   // null
     * }
     * ```
     */
    first<TOutput extends TInput>(
        predicateFn?: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput | null>;

    /**
     * The `firstOr` method returns the first item in the collection that passes ` predicateFn `
     * By default it will get the first item. If the collection is empty or no items passes ` predicateFn ` than ` defaultValue `.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .firstOr(-1);
     *   // 1
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .firstOr(-1, item => item > 2);
     *   // 3
     * }
     * ```
     * You can pass a function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .firstOr(() => -1, item => item > 10);
     *   // -1
     * }
     * ```
     * You can pass an async function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .firstOr(async () => -1, item => item > 10);
     *   // -1
     * }
     * ```
     */
    firstOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: AsyncLazyable<TExtended>,
        predicateFn?: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput | TExtended>;

    /**
     * The `firstOrFail` method returns the first item in the collection that passes ` predicateFn `.
     * By default it will get the first item. If the collection is empty or no items passes ` predicateFn ` than error is thrown.
     * @throws {ItemNotFoundCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .firstOrFail();
     *   // 1
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .firstOrFail(item => item > 2);
     *   // 3
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .firstOrFail(item => item > 10);
     *   // throws an error
     * }
     * ```
     */
    firstOrFail<TOutput extends TInput>(
        predicateFn?: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput>;

    /**
     * The `last` method returns the last item in the collection that passes ` predicateFn `.
     * By default it will get the last item. If the collection is empty or no items passes ` predicateFn ` than null i returned.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .last();
     *   // 4
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .last(item => item < 4);
     *   // 3
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .last(item => item > 10);
     *   // null
     * }
     * ```
     */
    last<TOutput extends TInput>(
        predicateFn?: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput | null>;

    /**
     * The `lastOr` method returns the last item in the collection that passes ` predicateFn `.
     * By default it will get the last item. If the collection is empty or no items passes ` predicateFn ` than ` defaultValue `.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .lastOr(-1);
     *   // 4
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .lastOr(-1, item => item < 4);
     *   // 3
     * }
     * ```
     * You can pass a function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .lastOr(() => -1, item => item > 10);
     *   // -1
     * }
     * ```
     * You can pass an async function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .lastOr(async () => -1, item => item > 10);
     *   // -1
     * }
     * ```
     */
    lastOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: AsyncLazyable<TExtended>,
        predicateFn?: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput | TExtended>;

    /**
     * The `lastOrFail` method returns the last item in the collection that passes ` predicateFn `.
     * By default it will get the last item. If the collection is empty or no items passes ` predicateFn ` than error is thrown.
     * @throws {ItemNotFoundCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .lastOrFail();
     *   // 4
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .lastOrFail(item => item < 4);
     *   // 3
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .lastOrFail(item => item > 10);
     *   // throws an error
     * }
     * ```
     */
    lastOrFail<TOutput extends TInput>(
        predicateFn?: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput>;

    /**
     * The `before` method returns the item that comes before the first item that matches `predicateFn`.
     * If the `predicateFn` does not match or matches the first item then null is returned.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *      .append([1, 2, 3, 4])
     *      .before(item => item === 2);
     *   // 1
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .before(item => item === 1);
     *   // null
     * }
     * ```
     */
    before(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<TInput | null>;

    /**
     * The `beforeOr` method returns the item that comes before the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the first item then `defaultValue` is returned.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .beforeOr(-1, item => item === 2);
     *   // 1
     * }
     * ```
     * You can pass a function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .beforeOr(() => -1, item => item === 1);
     *   // -1
     * }
     * ```
     * You can pass an async function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .beforeOr(async () => -1, item => item === 1);
     *   // -1
     * }
     * ```
     */
    beforeOr<TExtended = TInput>(
        defaultValue: AsyncLazyable<TExtended>,
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<TInput | TExtended>;

    /**
     * The `beforeOrFail` method returns the item that comes before the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the first item then an error is thrown.
     * @throws {ItemNotFoundCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .beforeOrFail(item => item === 2);
     *   // 1
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .beforeOrFail(item => item === 1);
     *   // error is thrown
     * }
     * ```
     */
    beforeOrFail(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<TInput>;

    /**
     * The `after` method returns the item that comes after the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the last item then null is returned.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .after(item => item === 2);
     *   // 3
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .after(item => item === 4);
     *   // null
     * }
     * ```
     */
    after(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<TInput | null>;

    /**
     * The `afterOr` method returns the item that comes after the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the last item then `defaultValue` is returned.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .afterOr(-1, item => item === 2);
     *   // 3
     * }
     * ```
     * You can pass a function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .afterOr(() => -1, item => item === 4);
     *   // -1
     * }
     * ```
     * You can pass an async function as default value.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .afterOr(async () => -1, item => item === 4);
     *   // -1
     * }
     * ```
     */
    afterOr<TExtended = TInput>(
        defaultValue: AsyncLazyable<TExtended>,
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<TInput | TExtended>;

    /**
     * The `afterOrFail` method returns the item that comes after the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the last item then an error is thrown.
     * @throws {ItemNotFoundCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .afterOrFail(item => item === 2);
     *   // 3
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4])
     *     .afterOrFail(item => item === 4);
     *   // error is thrown
     * }
     * ```
     */
    afterOrFail(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<TInput>;

    /**
     * The `sole` method returns the first item in the collection that passes `predicateFn`, but only if `predicateFn` matches exactly one item.
     * If no items matches or multiple items are found an error will be thrown.
     * @throws {ItemNotFoundCollectionError}
     * @throws {MultipleItemsFoundCollectionError}
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5])
     *     .sole(item => item === 4);
     *   // 4
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 4, 5])
     *     .sole(item => item === 4);
     *   // error is thrown
     * }
     * ```
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 5])
     *     .sole(item => item === 4);
     *   // error is thrown
     * }
     * ```
     */
    sole<TOutput extends TInput>(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput>;

    /**
     * The `nth` method creates a new collection consisting of every n-th item.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection.append(["a", "b", "c", "d", "e", "f"])
     *     .nth(4)
     *     .toArray();
     *   // ["a", "e"]
     * }
     * ```
     */
    nth(step: number): IAsyncCollection<TInput>;

    /**
     * The `count` method returns the total number of items in the collection that passes `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<number>): Promise<void> {
     *   await collection
     *     .append([1, 2, 3, 4, 5, 6])
     *     .count(value => value % 2 === 0);
     *   // 3
     * }
     * ```
     */
    count(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<number>;

    /**
     * The `size` returns the size of the collection.
     */
    size(): Promise<number>;

    /**
     * The `isEmpty` returns true if the collection is empty.
     */
    isEmpty(): Promise<boolean>;

    /**
     * The `isNotEmpty` returns true if the collection is not empty.
     */
    isNotEmpty(): Promise<boolean>;

    /**
     * The `searchFirst` return the index of the first item that matches `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "b", "c"])
     *     .searchFirst(item => item === "b");
     *   // 1
     * }
     * ```
     */
    searchFirst(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<number>;

    /**
     * The `searchLast` return the index of the last item that matches `predicateFn`.
     * @example
     * ```ts
     * import type { IAsyncCollection } from "@daiso-tech/core/collection/contracts";
     *
     * // Asume the inputed collection is empty.
     * async function main(collection: IAsyncCollection<string>): Promise<void> {
     *   await collection
     *     .append(["a", "b", "b", "c"])
     *     .searchLast(item => item === "b");
     *   // 2
     * }
     * ```
     */
    searchLast(
        predicateFn: AsyncPredicate<TInput, IAsyncCollection<TInput>>,
    ): Promise<number>;

    /**
     * The `forEach` method iterates through all items in the collection.
     */
    forEach(
        callback: AsyncForEach<TInput, IAsyncCollection<TInput>>,
    ): Promise<void>;

    /**
     * The `toArray` method converts the collection to a new {@link Array | `Array`}.
     */
    toArray(): Promise<Array<TInput>>;

    /**
     * The `toRecord` method converts the collection to a new {@link Record | `Record`}.
     * An error will be thrown if item is not a tuple of size 2 where the first element is a string or a number.
     * @throws {TypeError}
     */
    toRecord(): Promise<EnsureRecord<TInput>>;

    /**
     * The `toMap` method converts the collection to a new {@link Map | `Map`}.
     * An error will be thrown if item is not a tuple of size 2.
     * @throws {TypeError}
     */
    toMap(): Promise<EnsureMap<TInput>>;
}

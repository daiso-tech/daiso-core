/**
 * @module Collection
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type Collapse,
    type Comparator,
    type PredicateInvokable,
    type ICollection,
    ItemNotFoundCollectionError,
    type Map,
    type Modifier,
    MultipleItemsFoundCollectionError,
    type Tap,
    type Transform,
    type Reduce,
    type ForEach,
    EmptyCollectionError,
    type CrossJoinResult,
    type EnsureMap,
    type EnsureRecord,
    type SerializedCollection,
} from "@/collection/contracts/_module.js";
import {
    isInvokable,
    isIterable,
    isPromiseLike,
    resolveInvokable,
    resolveIterableValue,
    type IterableValue,
    type Lazyable,
    resolveLazyable,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnexpectedError,
    OPTION,
    type Option,
    optionSome,
    optionNone,
} from "@/utilities/_module.js";

/**
 * All methods in `ListCollection` are executed eagerly.
 *
 * IMPORT_PATH: `"@daiso-tech/core/collection"`
 * @group Adapters
 */
export class ListCollection<TInput = unknown> implements ICollection<TInput> {
    /**
     * The `concat` static method is a convenient utility for easily concatenating multiple {@link Iterable | `Iterable`}.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * class MyIterable implements Iterable<number> {
     *   *[Symbol.iterator](): Iterator<number> {
     *     yield 1;
     *     yield 2;
     *     yield 3;
     *   }
     * }
     *
     * const collection = ListCollection.concat([
     *   new MyIterable(),
     *   new Set([1, 2, 3]),
     *   new Map([["a", 1], ["b", 2]]),
     *   ["a", "b", "c"]
     * ]);
     * collection.toArray();
     * // [1, 2, 3, 1, 2, 3, ["a", 1], ["b", 2], "a", "b", "c"]
     * ```
     */
    static concat<TValue>(
        iterables: IterableValue<IterableValue<TValue>>,
    ): ICollection<TValue> {
        let array: Array<TValue> = [];
        for (const iterable of resolveIterableValue(iterables)) {
            array = [...array, ...resolveIterableValue(iterable)];
        }
        return new ListCollection(array);
    }

    /**
     * The `difference` static method is used to compute the difference between two {@link Iterable | `Iterable`} instances. By default, the equality check is performed on each item.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = ListCollection.difference(
     *   [1, 2, 2, 3, 4, 5],
     *   [2, 4, 6, 8]
     * );
     * collection.toArray();
     * // [1, 3, 5]
     * ```
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = ListCollection.difference(
     *   [
     *     { name: "iPhone 6", brand: "Apple", type: "phone" },
     *     { name: "iPhone 5", brand: "Apple", type: "phone" },
     *     { name: "Apple Watch", brand: "Apple", type: "watch" },
     *     { name: "Galaxy S6", brand: "Samsung", type: "phone" },
     *     { name: "Galaxy Gear", brand: "Samsung", type: "watch" },
     *   ],
     *   [
     *     { name: "Apple Watch", brand: "Apple", type: "watch" },
     *   ],
     *   (product) => product.type
     * );
     * collection.toArray();
     * // [
     * //   { name: "iPhone 6", brand: "Apple", type: "phone" },
     * //   { name: "iPhone 5", brand: "Apple", type: "phone" },
     * //   { name: "Galaxy S6", brand: "Samsung", type: "phone" },
     * // ]
     * ```
     */
    static difference<TValue, TSelect>(
        iterableA: IterableValue<TValue>,
        iterableB: IterableValue<TValue>,
        selectFn?: Map<TValue, ICollection<TValue>, TSelect>,
    ): ICollection<TValue> {
        return new ListCollection(iterableA).difference(iterableB, selectFn);
    }

    /**
     * The `zip` static method merges together the values of `iterableA` with the values of the `iterableB` at their corresponding index.
     * The returned collection has size of the shortest collection.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = ListCollection.zip(["Chair", "Desk"], [100, 200]);
     * collection.toArray();
     * // [["Chair", 100], ["Desk", 200]]
     * ```
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = ListCollection.zip(["Chair", "Desk", "Couch"], [100, 200]);
     * collection.toArray();
     * // [["Chair", 100], ["Desk", 200]]
     * ```
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = ListCollection.zip(["Chair", "Desk"], [100, 200, 300]);
     * collection.toArray();
     * // [["Chair", 100], ["Desk", 200]]
     * ```
     */
    static zip<TValueA, TValueB>(
        iterableA: IterableValue<TValueA>,
        iterableB: IterableValue<TValueB>,
    ): ICollection<[TValueA, TValueB]> {
        return new ListCollection(iterableA).zip(iterableB);
    }

    static deserialize<TInput>(
        serializedValue: SerializedCollection<TInput>,
    ): ICollection<TInput> {
        return new ListCollection(serializedValue.items);
    }

    private array: Array<TInput>;

    /**
     * The `constructor` takes an {@link Iterable | `Iterable`}.
     *
     * Works with `Array`.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = new ListCollection([1, 2, 3, 4]);
     * ```
     *
     * Works with `String`.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = new ListCollection("ABCDE");
     * ```
     *
     * Works with `Set`.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = new ListCollection(new Set([1, 2, 2 4]));
     * ```
     *
     * Works with `Map`.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * const collection = new ListCollection(new Map([["a", 1], ["b", 2]]));
     * ```
     *
     * Works with any `Iterable`.
     * @example
     * ```ts
     * import { ListCollection } from "@daiso-tech/core/collection";
     *
     * class MyIterable implements Iterable<number> {
     *   *[Symbol.iterator](): Iterator<number> {
     *     yield 1;
     *     yield 2;
     *     yield 3;
     *   }
     * }
     * const collection = new ListCollection(new MyIterable());
     * ```
     */
    constructor(iterable: IterableValue<TInput> = []) {
        this.array = [...resolveIterableValue(iterable)];
    }

    serialize(): SerializedCollection<TInput> {
        return {
            version: "1",
            items: this.toArray(),
        };
    }

    *[Symbol.iterator](): Iterator<TInput> {
        yield* this.array;
    }

    toIterator(): Iterator<TInput, void> {
        return this[Symbol.iterator]() as Iterator<TInput, void>;
    }

    entries(): ICollection<[number, TInput]> {
        return new ListCollection(this.array.entries());
    }

    keys(): ICollection<number> {
        return new ListCollection(this.array.keys());
    }

    copy(): ICollection<TInput> {
        return new ListCollection(this);
    }

    filter<TOutput extends TInput>(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TOutput> {
        return new ListCollection(
            this.array.filter((item, index) =>
                resolveInvokable(predicateFn)(item, index, this),
            ) as Array<TOutput>,
        );
    }

    validate<TOutput>(
        schema: StandardSchemaV1<TInput, TOutput>,
    ): ICollection<TOutput> {
        const validatedItems: Array<TOutput> = [];
        for (const item of this.array) {
            const result = schema["~standard"].validate(item);
            if (isPromiseLike(result)) {
                throw new TypeError("Schema validation must be synchronous");
            }
            if (!result.issues) {
                validatedItems.push(result.value);
            }
        }
        return new ListCollection(validatedItems);
    }

    reject<TOutput extends TInput>(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<Exclude<TInput, TOutput>> {
        return new ListCollection(
            this.array.filter(
                (item, index) =>
                    !resolveInvokable(predicateFn)(item, index, this),
            ) as Array<Exclude<TInput, TOutput>>,
        );
    }

    map<TOutput>(
        mapFn: Map<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TOutput> {
        return new ListCollection(
            this.array.map((item, index) =>
                resolveInvokable(mapFn)(item, index, this),
            ),
        );
    }

    reduce(reduceFn: Reduce<TInput, ICollection<TInput>, TInput>): TInput;
    reduce(
        reduceFn: Reduce<TInput, ICollection<TInput>, TInput>,
        // eslint-disable-next-line @typescript-eslint/unified-signatures
        initialValue: TInput,
    ): TInput;
    reduce<TOutput>(
        reduceFn: Reduce<TInput, ICollection<TInput>, TOutput>,
        initialValue: TOutput,
    ): TOutput;
    reduce<TOutput = TInput>(
        reduceFn: Reduce<TInput, ICollection<TInput>, TOutput>,
        initialValue?: TOutput,
    ): TOutput {
        if (initialValue === undefined && this.isEmpty()) {
            throw new TypeError(
                "Reduce of empty iterable must be inputed a initial value",
            );
        }
        if (initialValue !== undefined) {
            return this.array.reduce<TOutput>(
                (initialValue, item, index) =>
                    resolveInvokable(reduceFn)(initialValue, item, index, this),
                initialValue,
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.array.reduce((initialValue, item, index) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            const reduce = reduceFn as any;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return reduce(initialValue, item, index, this);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
    }

    join(separator = ","): Extract<TInput, string> {
        for (const item of this) {
            if (typeof item !== "string") {
                throw new TypeError("Item type is invalid must be string");
            }
        }
        return this.array.join(separator) as Extract<TInput, string>;
    }

    collapse(): ICollection<Collapse<TInput>> {
        const items: Array<TInput> = [];
        for (const item of this.array) {
            if (isIterable<TInput>(item)) {
                items.push(...item);
            } else {
                items.push(item);
            }
        }
        return new ListCollection(items as Array<Collapse<TInput>>);
    }

    flatMap<TOutput>(
        mapFn: Map<TInput, ICollection<TInput>, Iterable<TOutput>>,
    ): ICollection<TOutput> {
        return new ListCollection(
            this.array.flatMap((item, index) => [
                ...resolveInvokable(mapFn)(item, index, this),
            ]),
        );
    }

    change<TFilterOutput extends TInput, TMapOutput>(
        predicateFn: PredicateInvokable<
            TInput,
            ICollection<TInput>,
            TFilterOutput
        >,
        mapFn: Map<TFilterOutput, ICollection<TInput>, TMapOutput>,
    ): ICollection<TInput | TFilterOutput | TMapOutput> {
        return new ListCollection<TInput | TFilterOutput | TMapOutput>(
            this.array.map((item, index) => {
                if (resolveInvokable(predicateFn)(item, index, this)) {
                    return resolveInvokable(mapFn)(
                        item as TFilterOutput,
                        index,
                        this,
                    );
                }
                return item;
            }),
        );
    }

    set(
        index: number,
        value: TInput | Map<TInput, ICollection<TInput>, TInput>,
    ): ICollection<TInput> {
        if (index < 0) {
            return this;
        }
        if (index >= this.array.length) {
            return this;
        }
        const item = this.array[index];
        if (item === undefined) {
            return this;
        }
        if (isInvokable(value)) {
            value = resolveInvokable(value)(item, index, this);
        }
        const newArray = [...this.array];
        newArray[index] = value;
        return new ListCollection(newArray);
    }

    get(index: number): TInput | null {
        return this.array[index] ?? null;
    }

    getOrFail(index: number): TInput {
        const item = this.get(index);
        if (item === null) {
            throw ItemNotFoundCollectionError.create();
        }
        return item;
    }

    page(page: number, pageSize: number): ICollection<TInput> {
        if (page < 0) {
            return this.skip(page * pageSize).take(pageSize);
        }
        return this.skip((page - 1) * pageSize).take(pageSize);
    }

    sum(): Extract<TInput, number> {
        if (this.isEmpty()) {
            throw EmptyCollectionError.create();
        }
        const result = this.reduce((sum, item) => {
            if (typeof item !== "number") {
                throw new TypeError("Item type is invalid must be number");
            }
            return sum + item;
        }, 0);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
        return result as any;
    }

    average(): Extract<TInput, number> {
        if (this.isEmpty()) {
            throw EmptyCollectionError.create();
        }
        return ((this.sum() as number) / this.size()) as Extract<
            TInput,
            number
        >;
    }

    median(): Extract<TInput, number> {
        if (this.isEmpty()) {
            throw EmptyCollectionError.create();
        }
        const nbrs = this.array.map((item) => {
                if (typeof item !== "number") {
                    throw new TypeError("Item type is invalid must be number");
                }
                return item;
            }),
            index = Math.floor(this.array.length / 2),
            isEven = this.array.length % 2 === 0,
            a = nbrs[index];
        if (a === undefined) {
            throw new UnexpectedError("Is in invalid state");
        }
        const b = nbrs[index - 1];
        if (isEven) {
            if (b === undefined) {
                throw new UnexpectedError("Is in invalid state");
            }
            return ((a + b) / 2) as Extract<TInput, number>;
        }
        return a as Extract<TInput, number>;
    }

    min(): Extract<TInput, number> {
        if (this.isEmpty()) {
            throw EmptyCollectionError.create();
        }
        let min = 0;
        for (const item of this.array) {
            if (typeof item !== "number") {
                throw new TypeError("Item type is invalid must be number");
            }
            if (min === 0) {
                min = item;
            } else if (min > item) {
                min = item;
            }
        }
        return min as Extract<TInput, number>;
    }

    max(): Extract<TInput, number> {
        if (this.isEmpty()) {
            throw EmptyCollectionError.create();
        }
        let max = 0;
        for (const item of this.array) {
            if (typeof item !== "number") {
                throw new TypeError("Item type is invalid must be number");
            }
            if (max === 0) {
                max = item;
            } else if (max < item) {
                max = item;
            }
        }
        return max as Extract<TInput, number>;
    }

    percentage(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): number {
        if (this.isEmpty()) {
            throw EmptyCollectionError.create();
        }
        return (this.count(predicateFn) / this.size()) * 100;
    }

    some<TOutput extends TInput>(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): boolean {
        return this.array.some((item, index) =>
            resolveInvokable(predicateFn)(item, index, this),
        );
    }

    every<TOutput extends TInput>(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): boolean {
        return this.array.every((item, index) =>
            resolveInvokable(predicateFn)(item, index, this),
        );
    }

    take(limit: number): ICollection<TInput> {
        return new ListCollection(this.array.slice(0, limit));
    }

    takeUntil(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): ICollection<TInput> {
        const items: Array<TInput> = [];
        for (const [index, item] of this.array.entries()) {
            if (resolveInvokable(predicateFn)(item, index, this)) {
                break;
            }
            items.push(item);
        }
        return new ListCollection(items);
    }

    takeWhile(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): ICollection<TInput> {
        return this.takeUntil(
            (...arguments_) => !resolveInvokable(predicateFn)(...arguments_),
        );
    }

    skip(offset: number): ICollection<TInput> {
        return new ListCollection(this.array.slice(offset));
    }

    skipUntil(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): ICollection<TInput> {
        let hasMatched = false;
        const items: Array<TInput> = [];
        for (const [index, item] of this.array.entries()) {
            if (!hasMatched) {
                hasMatched = resolveInvokable(predicateFn)(item, index, this);
            }
            if (hasMatched) {
                items.push(item);
            }
        }
        return new ListCollection(items);
    }

    skipWhile(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): ICollection<TInput> {
        return this.skipUntil(
            (...arguments_) => !resolveInvokable(predicateFn)(...arguments_),
        );
    }

    when<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        if (condition) {
            return resolveInvokable(callback)(this) as ICollection<
                TInput | TExtended
            >;
        }
        return this as ICollection<TInput | TExtended>;
    }

    whenEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        return this.when(this.isEmpty(), callback);
    }

    whenNot<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        return this.when(!condition, callback);
    }

    whenNotEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        return this.when(this.isNotEmpty(), callback);
    }

    pipe<TOutput = TInput>(
        callback: Transform<ICollection<TInput>, TOutput>,
    ): TOutput {
        return resolveInvokable(callback)(this);
    }

    tap(callback: Tap<ICollection<TInput>>): ICollection<TInput> {
        resolveInvokable(callback)(new ListCollection(this));
        return this;
    }

    chunk(chunkSize: number): ICollection<ICollection<TInput>> {
        const chunks: Array<ICollection<TInput>> = [];
        for (let index = 0; index < this.size(); index += chunkSize) {
            chunks.push(
                new ListCollection(this.array.slice(index, index + chunkSize)),
            );
        }
        return new ListCollection(chunks);
    }

    chunkWhile(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): ICollection<ICollection<TInput>> {
        let currentChunk: ICollection<TInput> = new ListCollection<TInput>([]);
        const chunks: Array<ICollection<TInput>> = [];
        for (const [index, item] of this.array.entries()) {
            if (index === 0) {
                currentChunk = currentChunk.append([item]);
            } else if (
                resolveInvokable(predicateFn)(item, index, currentChunk)
            ) {
                currentChunk = currentChunk.append([item]);
            } else {
                chunks.push(currentChunk);
                currentChunk = new ListCollection<TInput>([item]);
            }
        }
        chunks.push(currentChunk);
        return new ListCollection(chunks);
    }

    split(chunkAmount: number): ICollection<ICollection<TInput>> {
        const size = this.size(),
            minChunkSize = Math.floor(size / chunkAmount),
            restSize = size % chunkAmount,
            chunkSizes = Array.from<number>({
                length: chunkAmount,
            }).fill(minChunkSize);

        for (let index = 1; index <= restSize; index++) {
            const chunkIndex = (index - 1) % chunkAmount;
            if (chunkSizes[chunkIndex] !== undefined) {
                chunkSizes[chunkIndex] = chunkSizes[chunkIndex] + 1;
            }
        }

        let end = 0,
            start = 0;
        const chunks: Array<ICollection<TInput>> = [];
        for (const chunkSize of chunkSizes) {
            end += chunkSize;
            chunks.push(new ListCollection(this.array.slice(start, end)));
            start += chunkSize;
        }

        return new ListCollection<ICollection<TInput>>(chunks);
    }

    partition(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): ICollection<ICollection<TInput>> {
        const chunkA: Array<TInput> = [],
            chunkB: Array<TInput> = [];
        for (const [index, item] of this.array.entries()) {
            if (resolveInvokable(predicateFn)(item, index, this)) {
                chunkA.push(item);
            } else {
                chunkB.push(item);
            }
        }
        return new ListCollection<ICollection<TInput>>([
            new ListCollection(chunkA),
            new ListCollection(chunkB),
        ]);
    }

    sliding(
        chunkSize: number,
        step = chunkSize - 1,
    ): ICollection<ICollection<TInput>> {
        let chunks: ICollection<ICollection<TInput>> = new ListCollection<
            ICollection<TInput>
        >([]);
        if (step <= 0) {
            return new ListCollection<ICollection<TInput>>([]);
        }
        for (let index = 0; index < this.size(); index += step) {
            const start = index;
            const end = index + chunkSize;
            chunks = chunks.append([this.slice(start, end)]);
            if (end >= this.size()) {
                break;
            }
        }
        return chunks;
    }

    groupBy<TOutput = TInput>(
        selectFn: Map<TInput, ICollection<TInput>, TOutput> = (item) =>
            item as unknown as TOutput,
    ): ICollection<[TOutput, ICollection<TInput>]> {
        const map = new Map<TOutput, ICollection<TInput>>();
        for (const [index, item] of this.array.entries()) {
            const key = resolveInvokable(selectFn)(item, index, this);
            let collection: ICollection<TInput> | undefined = map.get(key);
            if (collection === undefined) {
                collection = new ListCollection<TInput>([]);
                map.set(key, collection);
            }

            map.set(key, collection.append([item]));
        }
        return new ListCollection<[TOutput, ICollection<TInput>]>(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            map as any,
        );
    }

    countBy<TOutput = TInput>(
        selectFn: Map<TInput, ICollection<TInput>, TOutput> = (item) =>
            item as unknown as TOutput,
    ): ICollection<[TOutput, number]> {
        const map = new Map<TOutput, number>();
        for (const [index, item] of this.array.entries()) {
            const key = resolveInvokable(selectFn)(item, index, this);
            if (!map.has(key)) {
                map.set(key, 0);
            }
            const counter = map.get(key);
            if (counter !== undefined) {
                map.set(key, counter + 1);
            }
        }
        return new ListCollection(map);
    }

    unique<TOutput = TInput>(
        selectFn: Map<TInput, ICollection<TInput>, TOutput> = (item) =>
            item as unknown as TOutput,
    ): ICollection<TInput> {
        const set = new Set<TOutput>([]),
            items: Array<TInput> = [];
        for (const [index, item] of this.array.entries()) {
            const item_ = resolveInvokable(selectFn)(item, index, this);
            if (!set.has(item_)) {
                items.push(item);
            }
            set.add(item_);
        }
        return new ListCollection(items);
    }

    difference<TOutput = TInput>(
        iterable: IterableValue<TInput>,
        selectFn: Map<TInput, ICollection<TInput>, TOutput> = (item) =>
            item as unknown as TOutput,
    ): ICollection<TInput> {
        const differenceCollection = new ListCollection(iterable);
        return this.filter((item, index, collection) => {
            return !differenceCollection.some(
                (matchItem, matchIndex, matchCollection) => {
                    return (
                        resolveInvokable(selectFn)(item, index, collection) ===
                        resolveInvokable(selectFn)(
                            matchItem,
                            matchIndex,
                            matchCollection,
                        )
                    );
                },
            );
        });
    }

    repeat(amount: number): ICollection<TInput> {
        let collection: ICollection<TInput> = new ListCollection<TInput>([]);
        for (let index = 0; index < amount; index++) {
            collection = collection.append(this);
        }
        return collection;
    }

    padStart<TExtended = TInput>(
        maxLength: number,
        fillItems: IterableValue<TExtended>,
    ): ICollection<TInput | TExtended> {
        const fillItemsArray = [...resolveIterableValue(fillItems)];
        const size = this.size();
        const repeat = Math.floor((maxLength - size) / fillItemsArray.length);
        const resultItemsArray: Array<TInput | TExtended> = [];
        for (let index = 0; index < repeat; index++) {
            resultItemsArray.push(...fillItemsArray);
        }
        const restAmount = maxLength - (repeat * fillItemsArray.length + size);
        for (let index = 0; index < restAmount; index++) {
            const fillItem = fillItemsArray[index];
            if (fillItem !== undefined) {
                resultItemsArray.push(fillItem);
            }
        }
        resultItemsArray.push(...this);
        return new ListCollection<TInput | TExtended>(resultItemsArray);
    }

    padEnd<TExtended = TInput>(
        maxLength: number,
        fillItems: IterableValue<TExtended>,
    ): ICollection<TInput | TExtended> {
        const fillItemsArray = [...resolveIterableValue(fillItems)];
        const size = this.size();
        const repeat = Math.floor((maxLength - size) / fillItemsArray.length);
        const resultItemsArray: Array<TInput | TExtended> = [];
        for (let index = 0; index < repeat; index++) {
            resultItemsArray.push(...fillItemsArray);
        }
        const restAmount = maxLength - (repeat * fillItemsArray.length + size);
        for (let index = 0; index < restAmount; index++) {
            const fillItem = fillItemsArray[index];
            if (fillItem !== undefined) {
                resultItemsArray.push(fillItem);
            }
        }
        resultItemsArray.unshift(...this);
        return new ListCollection<TInput | TExtended>(resultItemsArray);
    }

    slice(start?: number, end?: number): ICollection<TInput> {
        return new ListCollection(this.array.slice(start, end));
    }

    prepend<TExtended = TInput>(
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        return new ListCollection([
            ...resolveIterableValue(iterable),
            ...this.array,
        ]);
    }

    append<TExtended = TInput>(
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        return new ListCollection([
            ...this.array,
            ...resolveIterableValue(iterable),
        ]);
    }

    insertBefore<TExtended = TInput>(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        const index = this.array.findIndex((item, index) =>
            resolveInvokable(predicateFn)(item, index, this),
        );
        if (index === -1) {
            return new ListCollection<TInput | TExtended>(this.array);
        }
        const newArray = [...this.array] as Array<TInput | TExtended>;
        newArray.splice(index, 0, ...resolveIterableValue(iterable));
        return new ListCollection(newArray);
    }

    insertAfter<TExtended = TInput>(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        const index = this.array.findIndex((item, index) =>
            resolveInvokable(predicateFn)(item, index, this),
        );
        if (index === -1) {
            return new ListCollection(this.array) as ICollection<
                TInput | TExtended
            >;
        }
        const firstPart = this.array.slice(0, index + 1),
            lastPart = this.array.slice(index + 1);
        return new ListCollection([
            ...firstPart,
            ...resolveIterableValue(iterable),
            ...lastPart,
        ]) as ICollection<TInput | TExtended>;
    }

    crossJoin<TExtended>(
        iterable: IterableValue<TExtended>,
    ): ICollection<CrossJoinResult<TInput, TExtended>> {
        const array: Array<Array<TInput | TExtended>> = [];
        for (const itemA of this) {
            for (const itemB of resolveIterableValue(iterable)) {
                array.push([
                    ...(isIterable<TInput | TExtended>(itemA)
                        ? itemA
                        : [itemA]),
                    ...(isIterable<TInput | TExtended>(itemB)
                        ? itemB
                        : [itemB]),
                ]);
            }
        }

        return new ListCollection(
            array as Array<CrossJoinResult<TInput, TExtended>>,
        );
    }

    zip<TExtended>(
        iterable: IterableValue<TExtended>,
    ): ICollection<[TInput, TExtended]> {
        const iterableArray = [...resolveIterableValue(iterable)];
        let size = iterableArray.length;
        if (size > this.size()) {
            size = this.size();
        }
        const items: Array<[TInput, TExtended]> = [];
        for (let index = 0; index < size; index++) {
            const itemA = this.array[index],
                itemB = iterableArray[index];
            if (itemA === undefined || itemB === undefined) {
                continue;
            }
            items.push([itemA, itemB]);
        }
        return new ListCollection(items);
    }

    sort(comparator?: Comparator<TInput>): ICollection<TInput> {
        if (comparator === undefined) {
            return new ListCollection(this.array.sort());
        }
        return new ListCollection(
            this.array.sort(resolveInvokable(comparator)),
        );
    }

    reverse(_chunkSize?: number): ICollection<TInput> {
        return new ListCollection([...this.array].reverse());
    }

    shuffle(mathRandom = Math.random): ICollection<TInput> {
        const newArray = [...this.array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(mathRandom() * (i + 1));
            const temp = newArray[i];
            if (newArray[j] !== undefined) {
                newArray[i] = newArray[j];
            }
            if (temp !== undefined) {
                newArray[j] = temp;
            }
        }
        return new ListCollection(newArray);
    }

    private first_<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): Option<TOutput> {
        if (predicateFn === undefined) {
            const firstItem = this.array[0];
            const hasFirstItem = this.array.some(
                (_value, index) => index === 0,
            );
            if (hasFirstItem) {
                return optionSome(firstItem as TOutput);
            }
            return optionNone();
        }

        let index = 0;
        for (const item of this) {
            if (resolveInvokable(predicateFn)(item, index, this)) {
                return optionSome(item as TOutput);
            }
            index++;
        }
        return optionNone();
    }

    first<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        const result = this.first_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return null;
    }

    firstOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn: PredicateInvokable<
            TInput,
            ICollection<TInput>,
            TOutput
        > = () => true,
    ): TOutput | TExtended {
        const result = this.first_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return resolveLazyable(defaultValue);
    }

    firstOrFail<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        const result = this.first_(predicateFn);
        if (result.type === OPTION.NONE) {
            throw ItemNotFoundCollectionError.create();
        }
        return result.value;
    }

    private last_<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): Option<TOutput> {
        if (predicateFn === undefined) {
            const firstItem = this.array.at(-1);
            const hasLastItem = this.array.some(
                (_value, index) => index === this.array.length - 1,
            );
            if (hasLastItem) {
                return optionSome(firstItem as TOutput);
            }
            return optionNone();
        }

        let index = 0;
        let matchedItem: TOutput | null = null;
        for (const item of this) {
            if (resolveInvokable(predicateFn)(item, index, this)) {
                matchedItem = item as TOutput;
            }
            index++;
        }
        if (matchedItem !== null) {
            return optionSome(matchedItem);
        }
        return optionNone();
    }

    last<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        const result = this.last_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return null;
    }

    lastOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn: PredicateInvokable<
            TInput,
            ICollection<TInput>,
            TOutput
        > = () => true,
    ): TOutput | TExtended {
        const result = this.last_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return resolveLazyable(defaultValue);
    }

    lastOrFail<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        const result = this.last_(predicateFn);
        if (result.type === OPTION.NONE) {
            throw ItemNotFoundCollectionError.create();
        }
        return result.value;
    }

    private before_<TOutput extends TInput>(
        predicateFn: PredicateInvokable<
            TInput,
            ICollection<TInput>,
            TOutput
        > = () => true,
    ): Option<TOutput> {
        let beforeItem: TInput | null = null,
            index = 0;
        for (const item of this) {
            if (
                resolveInvokable(predicateFn)(item, index, this) &&
                beforeItem !== null
            ) {
                return optionSome(beforeItem as TOutput);
            }
            index++;
            beforeItem = item;
        }
        return optionNone();
    }

    before<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        const result = this.before_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return null;
    }

    beforeOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn: PredicateInvokable<
            TInput,
            ICollection<TInput>,
            TOutput
        > = () => true,
    ): TOutput | TExtended {
        const result = this.before_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return resolveLazyable(defaultValue);
    }

    beforeOrFail<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        const result = this.before_(predicateFn);
        if (result.type === OPTION.NONE) {
            throw ItemNotFoundCollectionError.create();
        }
        return result.value;
    }

    private after_<TOutput extends TInput>(
        predicateFn: PredicateInvokable<
            TInput,
            ICollection<TInput>,
            TOutput
        > = () => true,
    ): Option<TOutput> {
        let hasMatched = false,
            index = 0;
        for (const item of this) {
            if (hasMatched) {
                return optionSome(item as TOutput);
            }
            hasMatched = resolveInvokable(predicateFn)(item, index, this);
            index++;
        }
        return optionNone();
    }

    after<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        const result = this.after_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return null;
    }

    afterOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn: PredicateInvokable<
            TInput,
            ICollection<TInput>,
            TOutput
        > = () => true,
    ): TOutput | TExtended {
        const result = this.after_(predicateFn);
        if (result.type === OPTION.SOME) {
            return result.value;
        }
        return resolveLazyable(defaultValue);
    }

    afterOrFail<TOutput extends TInput>(
        predicateFn?: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        const result = this.after_(predicateFn);
        if (result.type === OPTION.NONE) {
            throw ItemNotFoundCollectionError.create();
        }
        return result.value;
    }

    sole<TOutput extends TInput>(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        let index = 0,
            matchedItem: Option<TOutput> = optionNone();
        for (const item of this) {
            if (resolveInvokable(predicateFn)(item, index, this)) {
                if (matchedItem.type === OPTION.SOME) {
                    throw MultipleItemsFoundCollectionError.create();
                }
                matchedItem = optionSome(item as TOutput);
            }
            index++;
        }
        if (matchedItem.type === OPTION.NONE) {
            throw ItemNotFoundCollectionError.create();
        }
        return matchedItem.value;
    }

    nth(step: number): ICollection<TInput> {
        return this.filter((_item, index) => index % step === 0);
    }

    count(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): number {
        return this.filter(predicateFn).size();
    }

    size(): number {
        return this.array.length;
    }

    isEmpty(): boolean {
        return this.array.length === 0;
    }

    isNotEmpty(): boolean {
        return this.array.length !== 0;
    }

    searchFirst(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): number {
        return this.array.findIndex((item, index) =>
            resolveInvokable(predicateFn)(item, index, this),
        );
    }

    searchLast(
        predicateFn: PredicateInvokable<TInput, ICollection<TInput>>,
    ): number {
        let matchedIndex = -1;
        for (const [index, item] of this.array.entries()) {
            if (resolveInvokable(predicateFn)(item, index, this)) {
                matchedIndex = index;
            }
        }
        return matchedIndex;
    }

    forEach(callback: ForEach<TInput, ICollection<TInput>>): void {
        for (const [index, item] of this.array.entries()) {
            resolveInvokable(callback)(item, index, this);
        }
    }

    toArray(): Array<TInput> {
        return [...this.array];
    }

    toRecord(): EnsureRecord<TInput> {
        const record: Record<string | number | symbol, unknown> = {};
        for (const item of this) {
            if (!Array.isArray(item)) {
                throw new TypeError(
                    "Item type is invalid must be a tuple of size 2 where first tuple item is a string or number or symbol",
                );
            }
            if (item.length !== 2) {
                throw new TypeError(
                    "Item type is invalid must be a tuple of size 2 where first tuple item is a string or number or symbol",
                );
            }
            const [key, value] = item;
            if (
                !(
                    typeof key === "string" ||
                    typeof key === "number" ||
                    typeof key === "symbol"
                )
            ) {
                throw new TypeError(
                    "Item type is invalid must be a tuple of size 2 where first tuple item is a string or number or symbol",
                );
            }
            record[key] = value;
        }
        return record as EnsureRecord<TInput>;
    }

    toMap(): EnsureMap<TInput> {
        const map = new Map();
        for (const item of this) {
            if (!Array.isArray(item)) {
                throw new TypeError(
                    "Item type is invalid must be a tuple of size 2",
                );
            }
            if (item.length !== 2) {
                throw new TypeError(
                    "Item type is invalid must be a tuple of size 2",
                );
            }
            const [key, value] = item;
            map.set(key, value);
        }
        return map as EnsureMap<TInput>;
    }
}

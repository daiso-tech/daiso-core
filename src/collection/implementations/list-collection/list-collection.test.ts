import { describe, expect, test } from "vitest";

import {
    ItemNotFoundCollectionError,
    MultipleItemsFoundCollectionError,
    EmptyCollectionError,
} from "@/collection/contracts/_module.js";
import { ListCollection } from "@/collection/implementations/list-collection/_module.js";

describe("class: ListCollection", () => {
    describe("method: filter", () => {
        test(`Should filter in all "a" of ["a", "bc", "c", "a", "d", "a"]`, () => {
            const arr = ["a", "bc", "c", "a", "d", "a"],
                collection = new ListCollection(arr),
                predicateFn = (item: string): boolean => item === "a",
                newCollection = collection.filter(predicateFn);
            expect(newCollection.toArray()).toEqual(arr.filter(predicateFn));
        });
        test("Should input correct indexes to ion", () => {
            const collection = new ListCollection([
                    "a",
                    "bc",
                    "c",
                    "a",
                    "d",
                    "a",
                ]),
                indexes: Array<number> = [],
                predicateFn = (item: string, index: number): boolean => {
                    indexes.push(index);
                    return item === "a";
                };
            collection.filter(predicateFn).toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5]);
        });
    });
    describe("method: reject", () => {
        test(`Should filter out all "a" of ["a", "bc", "c", "a", "d", "a"]`, () => {
            const arr = ["a", "bc", "c", "a", "d", "a"],
                collection = new ListCollection(arr),
                predicateFn = (item: string): boolean => item === "a",
                newCollection = collection.reject(predicateFn);
            expect(newCollection.toArray()).toEqual(
                arr.filter((item) => !predicateFn(item)),
            );
        });
        test("Should input correct indexes to ion", () => {
            const collection = new ListCollection([
                    "a",
                    "bc",
                    "c",
                    "a",
                    "d",
                    "a",
                ]),
                indexes: Array<number> = [],
                predicateFn = (item: string, index: number): boolean => {
                    indexes.push(index);
                    return item === "a";
                };
            collection.reject(predicateFn).toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5]);
        });
    });
    describe("method: map", () => {
        test("Should apply power by 2 for all items", () => {
            const arr = [2, 3, 4, 5],
                collection = new ListCollection(arr),
                mapFunction = (item: number): number => item ** 2,
                newCollection = collection.map(mapFunction);
            expect(newCollection.toArray()).toEqual(arr.map(mapFunction));
        });
        test("Should input correct indexes to map function", () => {
            const collection = new ListCollection([2, 3, 4, 5]),
                indexes: Array<number> = [],
                mapFunction = (item: number, index: number): number => {
                    indexes.push(index);
                    return item ** 2;
                };
            collection.map(mapFunction).toArray();
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
    });
    describe("method: reduce", () => {
        test("Should join all string items without initial values", () => {
            const arr = ["a", "b", "c", "d"],
                collection = new ListCollection(arr),
                seperator = "_#_",
                result = collection.reduce((firstItem, item) => {
                    return firstItem + seperator + item;
                });
            expect(result).toBe(arr.join(seperator));
        });
        test(`Should join all string items initial value "_#_"`, () => {
            const arr = ["a", "b", "c", "d"],
                collection = new ListCollection(arr),
                initialValue = "!",
                result = collection.reduce((initialValue, item) => {
                    return initialValue + item;
                }, initialValue);
            expect(result).toBe(initialValue + arr.join(""));
        });
        test("Should input correct indexes to reduce function", () => {
            const arr = ["a", "b", "c", "d"],
                collection = new ListCollection(arr),
                initialValue = "!",
                indexes: Array<number> = [];
            collection.reduce((initialValue, item, index) => {
                indexes.push(index);
                return initialValue + item;
            }, initialValue);
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
        test("Should throw TypeError when given an empty array without initial value", () => {
            const collection = new ListCollection<string>([]);
            expect(() => {
                collection.reduce((a, b) => a + b);
            }).toThrowError(TypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const arr = ["a", "b", "c", "d"],
                collection = new ListCollection(arr),
                seperator = "_#_";
            expect(
                collection.reduce((firstItem, item) => {
                    return firstItem + seperator + item;
                }),
            ).toBe(arr.join(seperator));
            expect(
                collection.reduce((firstItem, item) => {
                    return firstItem + seperator + item;
                }),
            ).toBe(arr.join(seperator));
        });
    });
    describe("method: join", () => {
        test(`Should join iterable of ["a", "b", "c"] to "a,b,c"`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.join()).toBe("a,b,c");
        });
        test(`Should join iterable of ["a", "b", "c"] to "a,b,c" with seperator "_#_"`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.join("_#_")).toBe("a_#_b_#_c");
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.join()).toBe("a,b,c");
            expect(collection.join()).toBe("a,b,c");
        });
    });
    describe("method: collapse", () => {
        test("Should flatten one level", () => {
            const collection = new ListCollection([
                [1, 2],
                [3, 4],
            ]);
            const collapsed = collection.collapse();
            expect(collapsed.toArray()).toEqual([1, 2, 3, 4]);
        });
    });
    describe("method: flatMap", () => {
        test("Should apply flatmap", () => {
            const collection = new ListCollection(["a", "ab", "b", "ba"]),
                newCollection = collection.flatMap((item, index) => [
                    index,
                    item,
                    item.length,
                ]);
            expect(newCollection.toArray()).toEqual([
                0,
                "a",
                1,
                1,
                "ab",
                2,
                2,
                "b",
                1,
                3,
                "ba",
                2,
            ]);
        });
        test("Should input correct indexes to map function", () => {
            const collection = new ListCollection(["a", "ab", "b", "ba"]),
                indexes: Array<number> = [],
                mapFunction = (
                    item: string,
                    index: number,
                ): [number, string, number] => {
                    indexes.push(index);
                    return [index, item, item.length];
                };
            collection.flatMap(mapFunction).toArray();
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
    });
    describe("method: change", () => {
        test("Should change all the items that match the predicate function", () => {
            const collection = new ListCollection([
                    "a",
                    "aa",
                    "b",
                    "bbb",
                    "c",
                    "cccc",
                ]),
                newCollection = collection.change(
                    (item) => item.length >= 2,
                    (item) => item.slice(0, -1),
                );
            expect(newCollection.toArray()).toEqual([
                "a",
                "a",
                "b",
                "bb",
                "c",
                "ccc",
            ]);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([
                    "a",
                    "aa",
                    "b",
                    "bbb",
                    "c",
                    "cccc",
                ]),
                indexes: Array<number> = [];
            collection
                .change(
                    (item, index) => {
                        indexes.push(index);
                        return item.length >= 2;
                    },
                    (item) => item.slice(0, -1),
                )
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5]);
        });
        test("Should input correct indexes to map function", () => {
            const collection = new ListCollection([
                    "a",
                    "aa",
                    "b",
                    "bbb",
                    "c",
                    "cccc",
                ]),
                indexes: Array<number> = [];
            collection
                .change(
                    (item) => item.length >= 2,
                    (item, index) => {
                        indexes.push(index);
                        return item.slice(0, -1);
                    },
                )
                .toArray();
            expect(indexes).toEqual([1, 3, 5]);
        });
    });
    describe("method: set", () => {
        test("Should update item when index is in range", () => {
            const collection = new ListCollection(["a", "b", "c", "d"]).set(
                0,
                "ab",
            );
            expect(collection.toArray()).toEqual(["ab", "b", "c", "d"]);
        });
        test("Should update item when index is in range using function", () => {
            const collection = new ListCollection(["a", "b", "c", "d"]).set(
                0,
                (prevValue) => `${prevValue}ab`,
            );
            expect(collection.toArray()).toEqual(["aab", "b", "c", "d"]);
        });
        test("Should not change collection when index is less than -1", () => {
            const array = ["a", "b", "c", "d"];
            const collection = new ListCollection(array).set(-1, "ab");
            expect(collection.toArray()).toEqual(array);
        });
        test("Should not change collection when index greater than or equal to size of the collection", () => {
            const array = ["a", "b", "c", "d"];
            const collection = new ListCollection(array).set(4, "ab");
            expect(collection.toArray()).toEqual(array);
        });
    });
    describe("method: get", () => {
        test("Should return null when index less than 0", () => {
            const collection = new ListCollection([1, 2, 3]);
            expect(collection.get(-1)).toBeNull();
        });
        test("Should return null when index greater than or equal to size of the collection", () => {
            const collection = new ListCollection([1, 2, 3]);
            expect(collection.get(3)).toBeNull();
        });
        test("Should return item when index is in range", () => {
            const collection = new ListCollection([1, 2, 3]);
            expect(collection.get(2)).toBe(3);
        });
    });
    describe("method: getOrFail", () => {
        test("Should return null when index less than 0", () => {
            const collection = new ListCollection([1, 2, 3]);
            expect(() => collection.getOrFail(-1)).toThrowError(
                ItemNotFoundCollectionError,
            );
        });
        test("Should return null when index greater than or equal to size of the collection", () => {
            const collection = new ListCollection([1, 2, 3]);
            expect(() => collection.getOrFail(3)).toThrowError(
                ItemNotFoundCollectionError,
            );
        });
        test("Should return item when index is in range", () => {
            const collection = new ListCollection([1, 2, 3]);
            expect(collection.getOrFail(2)).toBe(3);
        });
    });
    describe("method: page", () => {
        test("Should return the first 4 items when page is 1 and pageSize 4", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"],
                collection = new ListCollection(arr),
                newCollection = collection.page(1, 4);
            expect(newCollection.toArray()).toEqual(arr.slice(0, 4));
        });
        test("Should return the last 4 items when page is 2 and pageSize 4", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"],
                collection = new ListCollection(arr),
                newCollection = collection.page(2, 4);
            expect(newCollection.toArray()).toEqual(arr.slice(-4));
        });
        test("Should return the last 4 items when page is -1 and pageSize 4", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"],
                collection = new ListCollection(arr),
                newCollection = collection.page(-1, 4);
            expect(newCollection.toArray()).toEqual(arr.slice(-4));
        });
        test("Should return the first 2 items when page is 1 and pageSize 2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"],
                collection = new ListCollection(arr),
                newCollection = collection.page(1, 2);
            expect(newCollection.toArray()).toEqual(arr.slice(0, 2));
        });
        test("Should return the last 2 items when page is 4 and pageSize 2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"],
                collection = new ListCollection(arr),
                newCollection = collection.page(4, 2);
            expect(newCollection.toArray()).toEqual(arr.slice(-2));
        });
        test("Should return the last 2 items when page is -1 and pageSize 2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"],
                collection = new ListCollection(arr),
                newCollection = collection.page(-1, 2);
            expect(newCollection.toArray()).toEqual(arr.slice(-2));
        });
        test("Should return the last 2 items when page is -4 and pageSize -2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"],
                collection = new ListCollection(arr),
                newCollection = collection.page(-2, 2);
            expect(newCollection.toArray()).toEqual(arr.slice(-4, -2));
        });
        test("Should return the 4:nth, 5:nth, 6:nth items when page is 2 and pageSize 3", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const page = collection.page(2, 3);
            expect(page.toArray()).toEqual([4, 5, 6]);
        });
    });
    describe("method: sum", () => {
        test("Should calculate sum iterable of [1, 2, 3, 4] to 10", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.sum()).toBe(10);
        });
        test("Should throw TypeError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.sum();
            }).toThrowError(TypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.sum()).toBe(10);
            expect(collection.sum()).toBe(10);
        });
        test("Should throw EmptyCollectionError when collection is empty", () => {
            const collection = new ListCollection([]);
            expect(() => {
                collection.sum();
            }).toThrowError(EmptyCollectionError);
        });
    });
    describe("method: average", () => {
        test("Should calculate average iterable of [1, 2, 3, 4] to 2.5", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.average()).toBe(2.5);
        });
        test("Should throw TypeError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.average();
            }).toThrowError(TypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.average()).toBe(2.5);
            expect(collection.average()).toBe(2.5);
        });
        test("Should throw EmptyCollectionError when collection is empty", () => {
            const collection = new ListCollection([]);
            expect(() => {
                collection.average();
            }).toThrowError(EmptyCollectionError);
        });
    });
    describe("method: median", () => {
        test("Should calculate median iterable of [1, 2, 3, 4, 5] to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.median()).toBe(3);
        });
        test("Should calculate median iterable of [1, 2, 4, 5] to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.median()).toBe(3);
        });
        test("Should throw TypeError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.median();
            }).toThrowError(TypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.median()).toBe(3);
            expect(collection.median()).toBe(3);
        });
        test("Should throw EmptyCollectionError when collection is empty", () => {
            const collection = new ListCollection([]);
            expect(() => {
                collection.median();
            }).toThrowError(EmptyCollectionError);
        });
    });
    describe("method: min", () => {
        test("Should return the smallest number", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.min()).toBe(-2);
        });
        test("Should throw TypeError when containg a none number item", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4, "-4"]);
            expect(() => {
                collection.min();
            }).toThrowError(TypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.min()).toBe(-2);
            expect(collection.min()).toBe(-2);
        });
        test("Should throw EmptyCollectionError when collection is empty", () => {
            const collection = new ListCollection([]);
            expect(() => {
                collection.min();
            }).toThrowError(EmptyCollectionError);
        });
    });
    describe("method: max", () => {
        test("Should return the largest number", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.max()).toBe(4);
        });
        test("Should throw TypeError when containg a none number item", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4, "-4"]);
            expect(() => {
                collection.max();
            }).toThrowError(TypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.max()).toBe(4);
            expect(collection.max()).toBe(4);
        });
        test("Should throw EmptyCollectionError when collection is empty", () => {
            const collection = new ListCollection([]);
            expect(() => {
                collection.max();
            }).toThrowError(EmptyCollectionError);
        });
    });
    describe("method: percentage", () => {
        test(`Should return 50 when filtering "a" of ["a", "b", "a", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "a", "b"]);
            expect(collection.percentage((item) => item === "a")).toBe(50);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([
                    "a",
                    "bc",
                    "c",
                    "a",
                    "d",
                    "a",
                ]),
                indexes: Array<number> = [],
                predicateFn = (item: string, index: number): boolean => {
                    indexes.push(index);
                    return item === "a";
                };
            collection.percentage(predicateFn);
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "a", "b"]);
            expect(collection.percentage((item) => item === "a")).toBe(50);
            expect(collection.percentage((item) => item === "a")).toBe(50);
        });
        test("Should throw EmptyCollectionError when collection is empty", () => {
            const collection = new ListCollection([]);
            expect(() => {
                collection.percentage((item) => item === "a");
            }).toThrowError(EmptyCollectionError);
        });
    });
    describe("method: some", () => {
        test("Should return true when at least 1 item match the predicate function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.some((item) => item === "b")).toBe(true);
        });
        test("Should return false when all of the items does not match the predicate function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.some((item) => item === "d")).toBe(false);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([
                    "a",
                    "bc",
                    "c",
                    "a",
                    "d",
                    "a",
                ]),
                indexes: Array<number> = [],
                predicateFn = (item: string, index: number): boolean => {
                    indexes.push(index);
                    return item === "a";
                };
            collection.every(predicateFn);
            expect(indexes).toEqual([0, 1]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.some((item) => item === "b")).toBe(true);
            expect(collection.some((item) => item === "b")).toBe(true);
        });
    });
    describe("method: every", () => {
        test("Should return true when all items match the predicate function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.every((item) => item.length === 1)).toBe(true);
        });
        test("Should return false when one item does not match the predicate function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "aa"]);
            expect(collection.every((item) => item.length === 1)).toBe(false);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "aa"]),
                indexes: Array<number> = [];
            collection.every((item, index) => {
                indexes.push(index);
                return item.length === 1;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.every((item) => item.length === 1)).toBe(true);
            expect(collection.every((item) => item.length === 1)).toBe(true);
        });
    });
    describe("method: take", () => {
        test("Should take first item when input is 1", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                collection = new ListCollection(arr),
                newCollection = collection.take(1);
            expect(newCollection.toArray()).toEqual(arr.slice(0, 1));
        });
        test("Should take 5 first items when input is 5", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                collection = new ListCollection(arr),
                newCollection = collection.take(5);
            expect(newCollection.toArray()).toEqual(arr.slice(0, 5));
        });
        test("Should take 8 first items when input is -2", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                collection = new ListCollection(arr),
                newCollection = collection.take(-2);
            expect(newCollection.toArray()).toEqual(arr.slice(0, -2));
        });
    });
    describe("method: takeUntil", () => {
        test("Should take all items until item is larger or equal to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                newCollection = collection.takeUntil((item) => item >= 3);
            expect(newCollection.toArray()).toEqual([1, 2]);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                indexes: Array<number> = [];
            collection
                .takeUntil((item, index) => {
                    indexes.push(index);
                    return item >= 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2]);
        });
    });
    describe("method: takeWhile", () => {
        test("Should take all items while item is less than 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                newCollection = collection.takeWhile((item) => item < 3);
            expect(newCollection.toArray()).toEqual([1, 2]);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                indexes: Array<number> = [];
            collection
                .takeWhile((item, index) => {
                    indexes.push(index);
                    return item < 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2]);
        });
    });
    describe("method: skip", () => {
        test("Should skip first item when input is 1", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                collection = new ListCollection(arr),
                newCollection = collection.skip(1);
            expect(newCollection.toArray()).toEqual(arr.slice(1));
        });
        test("Should skip 5 first items when input is 5", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                collection = new ListCollection(arr),
                newCollection = collection.skip(5);
            expect(newCollection.toArray()).toEqual(arr.slice(5));
        });
        test("Should skip 8 first items when input is -2", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                collection = new ListCollection(arr),
                newCollection = collection.skip(-2);
            expect(newCollection.toArray()).toEqual(arr.slice(-2));
        });
    });
    describe("method: skipUntil", () => {
        test("Should skip all items until item is larger or equal to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                newCollection = collection.skipUntil((item) => item >= 3);
            expect(newCollection.toArray()).toEqual([3, 4]);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                indexes: Array<number> = [];
            collection
                .skipUntil((item, index) => {
                    indexes.push(index);
                    return item >= 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2]);
        });
    });
    describe("method: skipWhile", () => {
        test("Should skipp all items while item is less than 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                newCollection = collection.skipWhile((item) => item <= 3);
            expect(newCollection.toArray()).toEqual([4]);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4]),
                indexes: Array<number> = [];
            collection
                .skipWhile((item, index) => {
                    indexes.push(index);
                    return item <= 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
    });
    describe("method: when", () => {
        test("Should append items when statement is true", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.when(true, (collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should not append items when statement is false", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.when(false, (collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: whenEmpty", () => {
        test("Should append items when empty", () => {
            const collection = new ListCollection<string>([]),
                arr2 = [1, 2, 3],
                newCollection = collection.whenEmpty((collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual(arr2);
        });
        test("Should not append items when not empty", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.whenEmpty((collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: whenNot", () => {
        test("Should append items when statement is false", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.whenNot(false, (collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should not append items when statement is true", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.whenNot(true, (collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: whenNotEmpty", () => {
        test("Should append items when not empty", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.whenNotEmpty((collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should not append items when empty", () => {
            const collection = new ListCollection([]),
                arr2 = [1, 2, 3],
                newCollection = collection.whenNotEmpty((collection) =>
                    collection.append(arr2),
                );
            expect(newCollection.toArray()).toEqual([]);
        });
    });
    describe("method: pipe", () => {
        test("Should pipe multiple functions", () => {
            const collection = new ListCollection(["a", "ab", "abc", "abcd"]),
                result = collection
                    .pipe((collection) =>
                        collection.map((item) =>
                            new ListCollection(item).map((char) =>
                                char.charCodeAt(0),
                            ),
                        ),
                    )
                    .pipe((collection) =>
                        collection.map((collection) => collection.sum()),
                    )
                    .pipe((collection) => collection.sum());
            expect(result).toBeTypeOf("number");
        });
    });
    describe("method: tap", () => {
        test("Should change the original collection", () => {
            const arr = ["a", "ab", "abc"],
                collection = new ListCollection(arr).tap((collection) =>
                    collection.map((item) => item.length),
                );
            expect(collection.toArray()).toEqual(arr);
        });
    });
    describe("method: chunk", () => {
        test("Should group items into groups of size 1", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8],
                collection = new ListCollection(arr),
                newCollection = collection.chunk(1);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual(arr.map((item) => [item]));
        });
        test("Should group items into groups of size 4", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8],
                collection = new ListCollection(arr),
                newCollection = collection.chunk(4);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 4), arr.slice(4)]);
        });
    });
    describe("method: chunkWhile", () => {
        test("Should group items by checking if next item is the same as the current item", () => {
            const collection = new ListCollection("AABBCCCD".split("")),
                newCollection = collection.chunkWhile(
                    (value, _index, chunk) => value === chunk.last(),
                );
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["A", "A"], ["B", "B"], ["C", "C", "C"], ["D"]]);
        });
    });
    describe("method: split", () => {
        test("Should split items into 3 groups in equal size when size is 9", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9],
                collection = new ListCollection(arr),
                newCollection = collection.split(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 3), arr.slice(3, 6), arr.slice(6, 9)]);
        });
        test("Should split items into 3 groups where the first group have on item more when size is 10", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                collection = new ListCollection(arr),
                newCollection = collection.split(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 4), arr.slice(4, 7), arr.slice(7, 10)]);
        });
        test("Should split items into 3 groups where the first and second group have on item more when size is 11", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                collection = new ListCollection(arr),
                newCollection = collection.split(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 4), arr.slice(4, 8), arr.slice(8, 11)]);
        });
    });
    describe("method: partition", () => {
        test("Should group items into strings and number", () => {
            const arr = ["a", 1, "b", 2, "c", 3, "d", 4, "e", 5],
                collection = new ListCollection(arr),
                newCollection = collection.partition(
                    (item) => typeof item === "string",
                );
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                arr.filter((item) => typeof item === "string"),
                arr.filter((item) => typeof item === "number"),
            ]);
        });
        test("Should input correct indexes to predicate function", () => {
            const arr = ["a", 1, "b", 2, "c", 3, "d", 4, "e", 5],
                collection = new ListCollection(arr),
                indexes: Array<number> = [];
            collection
                .partition((item, index) => {
                    indexes.push(index);
                    return typeof item === "string";
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });
    describe("method: sliding", () => {
        test("Should group items into 7 groups when size is 2", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b"],
                ["b", "c"],
                ["c", "d"],
                ["d", "e"],
                ["e", "f"],
                ["f", "g"],
                ["g", "h"],
            ]);
        });
        test("Should group items into 4 groups when size is 3", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b", "c"],
                ["c", "d", "e"],
                ["e", "f", "g"],
                ["g", "h"],
            ]);
        });
        test("Should group items into 6 groups when size is 3 and step is 1", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(3, 1);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b", "c"],
                ["b", "c", "d"],
                ["c", "d", "e"],
                ["d", "e", "f"],
                ["e", "f", "g"],
                ["f", "g", "h"],
            ]);
        });
        test("Should group items into 6 groups when size is 4 and step is 2", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(4, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b", "c", "d"],
                ["c", "d", "e", "f"],
                ["e", "f", "g", "h"],
            ]);
        });
        test("Should group items into 4 groups when size is 1 and step is 2", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(1, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a"], ["c"], ["e"], ["g"]]);
        });
        test("Should group items into 3 groups when size is 1 and step is 3", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(1, 3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a"], ["d"], ["g"]]);
        });
        test("Should group items into 2 groups when size is 1 and step is 4", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(1, 3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a"], ["d"], ["g"]]);
        });
        test("Should group items into 1 groups when size is 2 and step is 1 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]),
                newCollection = collection.sliding(2, 1);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should group items into 1 groups when size is 2 and step is 2 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]),
                newCollection = collection.sliding(2, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should group items into 1 groups when size is 3 and step is 2 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]),
                newCollection = collection.sliding(2, 3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should group items into 1 groups when size is 2 and step is 3 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]),
                newCollection = collection.sliding(3, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should return empty collection when size is 1", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                    "g",
                    "h",
                ]),
                newCollection = collection.sliding(1);
            expect(newCollection.toArray()).toEqual([]);
        });
    });
    describe("method: groupBy", () => {
        test("Should group by with default selectFn function", () => {
            const arr = ["a", "b", "c", "a", "b", "c", "b", "d"],
                collection = new ListCollection(arr),
                newCollection = collection.groupBy();
            expect(
                newCollection
                    .map(([key, item]): [string, Array<string>] => [
                        key,
                        item.toArray(),
                    ])
                    .toArray(),
            ).toEqual([
                ["a", arr.filter((item) => item === "a")],
                ["b", arr.filter((item) => item === "b")],
                ["c", arr.filter((item) => item === "c")],
                ["d", arr.filter((item) => item === "d")],
            ]);
        });
        test("Should group by with custom selectFn function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const arr: Array<Person> = [
                    {
                        name: "Abra",
                        age: 20,
                    },
                    {
                        name: "Asmail",
                        age: 34,
                    },
                    {
                        name: "Ibra",
                        age: 50,
                    },
                    {
                        name: "Asmail",
                        age: 21,
                    },
                    {
                        name: "Abra",
                        age: 32,
                    },
                    {
                        name: "Abra",
                        age: 67,
                    },
                ],
                collection = new ListCollection<Person>(arr),
                newCollection = collection.groupBy((item) => {
                    return item.name;
                });
            expect(
                newCollection
                    .map(([key, item]): [string, Array<Person>] => [
                        key,
                        item.toArray(),
                    ])
                    .toArray(),
            ).toEqual([
                ["Abra", arr.filter((item) => item.name === "Abra")],
                ["Asmail", arr.filter((item) => item.name === "Asmail")],
                ["Ibra", arr.filter((item) => item.name === "Ibra")],
            ]);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "a",
                    "b",
                    "c",
                    "b",
                    "d",
                ]),
                indexes: Array<number> = [];
            collection
                .groupBy((item, index) => {
                    indexes.push(index);
                    return item;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });
    describe("method: countBy", () => {
        test("Should count by with default selectFn function", () => {
            const arr = ["a", "b", "c", "a", "b", "c", "b", "d"],
                collection = new ListCollection(arr),
                newCollection = collection.countBy();
            expect(newCollection.toArray()).toEqual([
                ["a", arr.filter((item) => item === "a").length],
                ["b", arr.filter((item) => item === "b").length],
                ["c", arr.filter((item) => item === "c").length],
                ["d", arr.filter((item) => item === "d").length],
            ]);
        });
        test("Should count by with custom selectFn function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const arr: Array<Person> = [
                    {
                        name: "Abra",
                        age: 20,
                    },
                    {
                        name: "Asmail",
                        age: 34,
                    },
                    {
                        name: "Ibra",
                        age: 50,
                    },
                    {
                        name: "Asmail",
                        age: 21,
                    },
                    {
                        name: "Abra",
                        age: 32,
                    },
                    {
                        name: "Abra",
                        age: 67,
                    },
                ],
                collection = new ListCollection<Person>(arr),
                newCollection = collection.countBy((item) => {
                    return item.name;
                });
            expect(newCollection.toArray()).toEqual([
                ["Abra", arr.filter((item) => item.name === "Abra").length],
                ["Asmail", arr.filter((item) => item.name === "Asmail").length],
                ["Ibra", arr.filter((item) => item.name === "Ibra").length],
            ]);
        });
        test("Should input correct indexes to selectFn function", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "a",
                    "b",
                    "c",
                    "b",
                    "d",
                ]),
                indexes: Array<number> = [];
            collection
                .countBy((item, index) => {
                    indexes.push(index);
                    return item;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });
    describe("method: unique", () => {
        test("Should return unique items with default map function", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "a",
                    "b",
                    "c",
                ]),
                newCollection = collection.unique();
            expect(newCollection.toArray()).toEqual(["a", "b", "c"]);
        });
        test("Should return unique items with custom map function", () => {
            const collection = new ListCollection([
                    "a",
                    "bb",
                    "cc",
                    "acc",
                    "b",
                    "cccc",
                ]),
                newCollection = collection.unique((item) => {
                    return item.length;
                });
            expect(newCollection.toArray()).toEqual(["a", "bb", "acc", "cccc"]);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "a",
                    "b",
                    "c",
                    "b",
                    "d",
                ]),
                indexes: Array<number> = [];
            collection
                .unique((item, index) => {
                    indexes.push(index);
                    return item;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });
    describe("method: difference", () => {
        test("Should remove all elements matches the given iterable elements with default selectFn function", () => {
            const collection = new ListCollection([1, 2, 2, 3, 4, 5]);
            const difference = collection.difference([2, 4, 6, 8]);
            expect(difference.toArray()).toEqual([1, 3, 5]);
        });
        test("Should remove all elements matches the given iterable elements with custom selectFn function", () => {
            type Product = {
                name: string;
                brand: string;
                type: string;
            };
            const items: Array<Product> = [
                { name: "iPhone 6", brand: "Apple", type: "phone" },
                { name: "iPhone 5", brand: "Apple", type: "phone" },
                { name: "Apple Watch", brand: "Apple", type: "watch" },
                { name: "Galaxy S6", brand: "Samsung", type: "phone" },
                { name: "Galaxy Gear", brand: "Samsung", type: "watch" },
            ];
            const collection = new ListCollection<Product>(items);
            const difference = collection.difference(
                [{ name: "Apple Watch", brand: "Apple", type: "watch" }],
                (product) => product.type,
            );
            expect(difference.toArray()).toStrictEqual([
                { name: "iPhone 6", brand: "Apple", type: "phone" },
                { name: "iPhone 5", brand: "Apple", type: "phone" },
                { name: "Galaxy S6", brand: "Samsung", type: "phone" },
            ]);
        });
    });
    describe("method: repeat", () => {
        test("Should repeath all elements 2 times when input is 3", () => {
            const arr = [1, 2, 3];
            const collection = new ListCollection(arr);
            const newCollection = collection.repeat(3);
            expect(newCollection.toArray()).toEqual([...arr, ...arr, ...arr]);
        });
    });
    describe("method: padStart", () => {
        test(`Should retuern "foofoofabc" when maxLength is 10 and fillItems "foo"`, () => {
            const result = new ListCollection("abc")
                .padStart(10, "foo")
                .join("");
            expect(result).toBe("foofoofabc");
        });
        test(`Should retuern "123abc" when maxLength is 6 and fillItems "abc"`, () => {
            const result = new ListCollection("abc")
                .padStart(6, "123465")
                .join("");
            expect(result).toBe("123abc");
        });
        test(`Should retuern "00000abc" when maxLength is 8 and fillItems "00000abc"`, () => {
            const result = new ListCollection("abc").padStart(8, "0").join("");
            expect(result).toBe("00000abc");
        });
        test(`Should retuern "abc" when maxLength is 1 and fillItems "_"`, () => {
            const result = new ListCollection("abc").padStart(1, "_").join("");
            expect(result).toBe("abc");
        });
    });
    describe("method: padEnd", () => {
        test(`Should retuern "abcfoofoof" when maxLength is 10 and fillItems "foo"`, () => {
            const result = new ListCollection("abc").padEnd(10, "foo").join("");
            expect(result).toBe("abcfoofoof");
        });
        test(`Should retuern "abc123" when maxLength is 6 and fillItems "abc"`, () => {
            const result = new ListCollection("abc")
                .padEnd(6, "123465")
                .join("");
            expect(result).toBe("abc123");
        });
        test(`Should retuern "abc00000" when maxLength is 8 and fillItems "00000abc"`, () => {
            const result = new ListCollection("abc").padEnd(8, "0").join("");
            expect(result).toBe("abc00000");
        });
        test(`Should retuern "abc" when maxLength is 1 and fillItems "_"`, () => {
            const result = new ListCollection("abc").padEnd(1, "_").join("");
            expect(result).toBe("abc");
        });
    });
    describe("method: slice", () => {
        test("Should return [1] when start is 0, end is 1 and array is [1, 2, 3, 4, 5]", () => {
            const arr = [1, 2, 3, 4, 5];
            const collection = new ListCollection(arr);
            const newCollection = collection.slice(0, 1);
            expect(newCollection.toArray()).toEqual(arr.slice(0, 1));
        });
        test("Should return [4, 5] when start is -2 and array is [1, 2, 3, 4, 5]", () => {
            const arr = [1, 2, 3, 4, 5];
            const collection = new ListCollection(arr);
            const newCollection = collection.slice(-2);
            expect(newCollection.toArray()).toEqual(arr.slice(-2));
        });
        test("Should return [1, 2, 3, 4] when start is 0, end is -1 and array is [1, 2, 3, 4, 5]", () => {
            const arr = [1, 2, 3, 4, 5];
            const collection = new ListCollection(arr);
            const newCollection = collection.slice(0, -1);
            expect(newCollection.toArray()).toEqual(arr.slice(0, -1));
        });
        test("Should return [3, 4] when start is 2, end is -1 and array is [1, 2, 3, 4, 5]", () => {
            const arr = [1, 2, 3, 4, 5];
            const collection = new ListCollection(arr);
            const newCollection = collection.slice(2, -1);
            expect(newCollection.toArray()).toEqual(arr.slice(2, -1));
        });
        test("Should return [2, 3, 4] when start is 1, end is 4 and array is [1, 2, 3, 4, 5]", () => {
            const arr = [1, 2, 3, 4, 5];
            const collection = new ListCollection(arr);
            const newCollection = collection.slice(1, 4);
            expect(newCollection.toArray()).toEqual(arr.slice(1, 4));
        });
        test("Should return [3, 4] when start is 2, end is 4 and array is [1, 2, 3, 4, 5]", () => {
            const arr = [1, 2, 3, 4, 5];
            const collection = new ListCollection(arr);
            const newCollection = collection.slice(2, 4);
            expect(newCollection.toArray()).toEqual(arr.slice(2, 4));
        });
    });
    describe("method: prepend", () => {
        test("Should prepend iterable", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                prependedCollection = collection.prepend(arr2);
            expect(prependedCollection.toArray()).toEqual([...arr2, ...arr1]);
        });
    });
    describe("method: append", () => {
        test("Should append iterable", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                appendedCollection = collection.append(arr2);
            expect(appendedCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
    });
    describe("method: insertBefore", () => {
        test("Should insert iterable before first item", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.insertBefore(
                    (item) => item === "a",
                    arr2,
                );
            expect(newCollection.toArray()).toEqual([...arr2, ...arr1]);
        });
        test("Should insert iterable before last item", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.insertBefore(
                    (item) => item === "c",
                    arr2,
                );
            expect(newCollection.toArray()).toEqual([
                ...arr1.slice(0, -1),
                ...arr2,
                ...arr1.slice(-1),
            ]);
        });
        test("Should not insert iterable if filter item not found", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.insertBefore(
                    (item) => item === "d",
                    arr2,
                );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: insertAfter", () => {
        test("Should insert iterable after last item", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.insertAfter(
                    (item) => item === "c",
                    arr2,
                );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should insert iterable after first item", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.insertAfter(
                    (item) => item === "a",
                    arr2,
                );
            expect(newCollection.toArray()).toEqual([
                ...arr1.slice(0, 1),
                ...arr2,
                ...arr1.slice(-2),
            ]);
        });
        test("Should not insert iterable if filter item not found", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.insertAfter(
                    (item) => item === "d",
                    arr2,
                );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: crossJoin", () => {
        test(`Should return 4 combinations when input iterable is [1, 2] and ["a", "b"]`, () => {
            const collection = new ListCollection([1, 2]);
            const matrix = collection.crossJoin(["a", "b"]);
            expect(matrix.toArray()).toEqual([
                [1, "a"],
                [1, "b"],
                [2, "a"],
                [2, "b"],
            ]);
        });
        test(`Should return 8 combinations when input iterable is [1, 2], ["a", "b"] and ["I", "II"]`, () => {
            const collection = new ListCollection([1, 2]);
            const matrix = collection
                .crossJoin(["a", "b"])
                .crossJoin(["I", "II"]);
            expect(matrix.toArray()).toEqual([
                [1, "a", "I"],
                [1, "a", "II"],
                [1, "b", "I"],
                [1, "b", "II"],
                [2, "a", "I"],
                [2, "a", "II"],
                [2, "b", "I"],
                [2, "b", "II"],
            ]);
        });
    });
    describe("method: zip", () => {
        test("Should zip iterable", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.zip(arr2);
            expect(newCollection.toArray()).toEqual([
                [arr1[0], arr2[0]],
                [arr1[1], arr2[1]],
                [arr1[2], arr2[2]],
            ]);
        });
        test("Should have the length of collection", () => {
            const arr1 = ["a", "b", "c", "d"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3],
                newCollection = collection.zip(arr2);
            expect(newCollection.toArray()).toEqual([
                [arr1[0], arr2[0]],
                [arr1[1], arr2[1]],
                [arr1[2], arr2[2]],
            ]);
        });
        test("Should have the length of input iterable", () => {
            const arr1 = ["a", "b", "c"],
                collection = new ListCollection(arr1),
                arr2 = [1, 2, 3, 4],
                newCollection = collection.zip(arr2);
            expect(newCollection.toArray()).toEqual([
                [arr1[0], arr2[0]],
                [arr1[1], arr2[1]],
                [arr1[2], arr2[2]],
            ]);
        });
    });
    describe("method: sort", () => {
        test("Sort numbers from smallest to largest with custom comparator function", () => {
            const arr = [-1, 2, 1, -3, 4, 20, 15, -5, -3],
                collection = new ListCollection(arr),
                newCollection = collection.sort((a, b) => a - b);
            expect(newCollection.toArray()).toEqual(
                [...arr].sort((a, b) => a - b),
            );
        });
        test("Sort numbers from smallest to largest with default compartor function", () => {
            const arr = [-1, 2, 1, -3, 4, 20, 15, -5, -3],
                collection = new ListCollection(arr),
                newCollection = collection.sort();
            expect(newCollection.toArray()).toEqual([...arr].sort());
        });
    });
    describe("method: reverse", () => {
        test("Should reverse iterable", () => {
            const arr = ["a", "b", "c", "d", "e", "f"],
                collection = new ListCollection(arr),
                newCollection = collection.reverse();
            expect(newCollection.toArray()).toEqual([...arr].reverse());
        });
    });
    describe("method: first", () => {
        test("Should return first item that matches the predicate function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Array<Person> = [
                    {
                        name: "Joe",
                        age: 20,
                    },
                    {
                        name: "Jhon",
                        age: 23,
                    },
                    {
                        name: "Joe",
                        age: 30,
                    },
                    {
                        name: "Jhon",
                        age: 50,
                    },
                ],
                collection = new ListCollection(persons),
                item = collection.first((person) => person.name === "Joe");
            expect(item).toEqual(persons[0]);
        });
        test("Should return first item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.first();
            expect(item).toBe(1);
        });
        test("Should return null when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.first((item) => item === 6);
            expect(item).toBe(null);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                indexes: Array<number> = [];
            collection.first((item, index) => {
                indexes.push(index);
                return item === 6;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.first()).toBe(1);
            expect(collection.first()).toBe(1);
        });
    });
    describe("method: firstOr", () => {
        test("Should return first item that matches the predicate function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Array<Person> = [
                    {
                        name: "Joe",
                        age: 20,
                    },
                    {
                        name: "Jhon",
                        age: 23,
                    },
                    {
                        name: "Joe",
                        age: 30,
                    },
                    {
                        name: "Jhon",
                        age: 50,
                    },
                ],
                collection = new ListCollection(persons),
                item = collection.firstOr(
                    null,
                    (person) => person.name === "Joe",
                );
            expect(item).toEqual(persons[0]);
        });
        test("Should return first item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.firstOr({
                    defaultValue: "a",
                });
            expect(item).toBe(1);
        });
        describe("Should return default value when item not found", () => {
            test("Value", () => {
                const collection = new ListCollection([1, 2, 3, 4, 5]),
                    item = collection.firstOr("a", (item) => item === 6);
                expect(item).toBe("a");
            });
            test("Function", () => {
                const collection = new ListCollection([1, 2, 3, 4, 5]),
                    item = collection.firstOr(
                        () => "a",
                        (item) => item === 6,
                    );
                expect(item).toBe("a");
            });
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                indexes: Array<number> = [];
            collection.firstOr(null, (item, index) => {
                indexes.push(index);
                return item === 6;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(
                collection.firstOr({
                    defaultValue: "a",
                }),
            ).toBe(1);
            expect(
                collection.firstOr({
                    defaultValue: "a",
                }),
            ).toBe(1);
        });
    });
    describe("method: firstOrFail", () => {
        test("Should return first item that matches the predicate function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Array<Person> = [
                    {
                        name: "Joe",
                        age: 20,
                    },
                    {
                        name: "Jhon",
                        age: 23,
                    },
                    {
                        name: "Joe",
                        age: 30,
                    },
                    {
                        name: "Jhon",
                        age: 50,
                    },
                ],
                collection = new ListCollection(persons),
                item = collection.firstOrFail(
                    (person) => person.name === "Joe",
                );
            expect(item).toEqual(persons[0]);
        });
        test("Should return first item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.firstOrFail();
            expect(item).toBe(1);
        });
        test("Should throw ItemNotFoundError when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(() => {
                collection.firstOrFail((item) => item === 6);
            }).toThrowError(ItemNotFoundCollectionError);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                indexes: Array<number> = [];
            try {
                collection.firstOrFail((item, index) => {
                    indexes.push(index);
                    return item === 6;
                });
            } catch (error: unknown) {
                if (!(error instanceof ItemNotFoundCollectionError)) {
                    throw error;
                }
            }
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.firstOrFail()).toBe(1);
            expect(collection.firstOrFail()).toBe(1);
        });
    });
    describe("method: last", () => {
        test("Should return last item that matches the predicate function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Array<Person> = [
                    {
                        name: "Joe",
                        age: 20,
                    },
                    {
                        name: "Jhon",
                        age: 23,
                    },
                    {
                        name: "Joe",
                        age: 30,
                    },
                    {
                        name: "Jhon",
                        age: 50,
                    },
                ],
                collection = new ListCollection(persons),
                item = collection.last((person) => person.name === "Joe");
            expect(item).toEqual(persons[2]);
        });
        test("Should return last item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.last();
            expect(item).toBe(5);
        });
        test("Should return null when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.last((item) => item === 6);
            expect(item).toBe(null);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                indexes: Array<number> = [];
            collection.last((item, index) => {
                indexes.push(index);
                return item === 6;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.last()).toBe(5);
            expect(collection.last()).toBe(5);
        });
    });
    describe("method: lastOr", () => {
        test("Should return last item that matches the predicate function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Array<Person> = [
                    {
                        name: "Joe",
                        age: 20,
                    },
                    {
                        name: "Jhon",
                        age: 23,
                    },
                    {
                        name: "Joe",
                        age: 30,
                    },
                    {
                        name: "Jhon",
                        age: 50,
                    },
                ],
                collection = new ListCollection(persons),
                item = collection.lastOr(
                    null,
                    (person) => person.name === "Joe",
                );
            expect(item).toEqual(persons[2]);
        });
        test("Should return last item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.lastOr({
                    defaultValue: "a",
                });
            expect(item).toBe(5);
        });
        describe("Should return default value when item not found", () => {
            test("Value", () => {
                const collection = new ListCollection([1, 2, 3, 4, 5]),
                    item = collection.lastOr("a", (item) => item === 6);
                expect(item).toBe("a");
            });
            test("Function", () => {
                const collection = new ListCollection([1, 2, 3, 4, 5]),
                    item = collection.lastOr(
                        () => "a",
                        (item) => item === 6,
                    );
                expect(item).toBe("a");
            });
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                indexes: Array<number> = [];
            collection.lastOr(null, (item, index) => {
                indexes.push(index);
                return item === 6;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(
                collection.lastOr({
                    defaultValue: "a",
                }),
            ).toBe(5);
            expect(
                collection.lastOr({
                    defaultValue: "a",
                }),
            ).toBe(5);
        });
    });
    describe("method: lastOrFail", () => {
        test("Should return last item that matches the predicate function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Array<Person> = [
                    {
                        name: "Joe",
                        age: 20,
                    },
                    {
                        name: "Jhon",
                        age: 23,
                    },
                    {
                        name: "Joe",
                        age: 30,
                    },
                    {
                        name: "Jhon",
                        age: 50,
                    },
                ],
                collection = new ListCollection(persons),
                item = collection.lastOrFail((person) => person.name === "Joe");
            expect(item).toEqual(persons[2]);
        });
        test("Should return last item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                item = collection.lastOrFail();
            expect(item).toBe(5);
        });
        test("Should throw ItemNotFoundError when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(() => {
                collection.lastOrFail((item) => item === 6);
            }).toThrowError(ItemNotFoundCollectionError);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]),
                indexes: Array<number> = [];
            try {
                collection.lastOrFail((item, index) => {
                    indexes.push(index);
                    return item === 6;
                });
            } catch (error: unknown) {
                if (!(error instanceof ItemNotFoundCollectionError)) {
                    throw error;
                }
            }
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.lastOrFail()).toBe(5);
            expect(collection.lastOrFail()).toBe(5);
        });
    });
    describe("method: before", () => {
        test(`Should return "a" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.before((item) => item === "b");
            expect(item).toBe("a");
        });
        test(`Should return "b" when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.before((item) => item === "c");
            expect(item).toBe("b");
        });
        test(`Should return null when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.before((item) => item === "a");
            expect(item).toBe(null);
        });
        test(`Should return null when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.before((item) => item === "d");
            expect(item).toBe(null);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "b", "c"]),
                indexes: Array<number> = [];
            collection.before((item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.before((item) => item === "c")).toBe("b");
            expect(collection.before((item) => item === "c")).toBe("b");
        });
    });
    describe("method: beforeOr", () => {
        test(`Should return "a" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.beforeOr(-1, (item) => item === "b");
            expect(item).toBe("a");
        });
        test(`Should return "b" when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.beforeOr(-1, (item) => item === "c");
            expect(item).toBe("b");
        });
        describe(`Should return default value when searching for string "a" of ["a", "b", "c"]`, () => {
            test("Value", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.beforeOr(-1, (item) => item === "a");
                expect(item).toBe(-1);
            });
            test("Fucntion", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.beforeOr(
                        () => -1,
                        (item) => item === "a",
                    );
                expect(item).toBe(-1);
            });
        });
        describe(`Should return default value when searching for string "d" of ["a", "b", "c"]`, () => {
            test("Value", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.beforeOr(-1, (item) => item === "d");
                expect(item).toBe(-1);
            });
            test("Function", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.beforeOr(
                        () => -1,
                        (item) => item === "d",
                    );
                expect(item).toBe(-1);
            });
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "b", "c"]),
                indexes: Array<number> = [];
            collection.beforeOr(null, (item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.beforeOr(-1, (item) => item === "c")).toBe("b");
            expect(collection.beforeOr(-1, (item) => item === "c")).toBe("b");
        });
    });
    describe("method: beforeOrFail", () => {
        test(`Should return "a" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.beforeOrFail((item) => item === "b");
            expect(item).toBe("a");
        });
        test(`Should return "b" when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.beforeOrFail((item) => item === "c");
            expect(item).toBe("b");
        });
        test(`Should throw ItemNotFoundError when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(() => {
                collection.beforeOrFail((item) => item === "d");
            }).toThrowError(ItemNotFoundCollectionError);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "b", "c"]),
                indexes: Array<number> = [];
            try {
                collection.beforeOrFail((item, index) => {
                    indexes.push(index);
                    return item === "c";
                });
            } catch (error: unknown) {
                if (!(error instanceof ItemNotFoundCollectionError)) {
                    throw error;
                }
            }
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.beforeOrFail((item) => item === "c")).toBe("b");
            expect(collection.beforeOrFail((item) => item === "c")).toBe("b");
        });
    });
    describe("method: after", () => {
        test(`Should return "c" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.after((item) => item === "b");
            expect(item).toBe("c");
        });
        test(`Should return "b" when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.after((item) => item === "a");
            expect(item).toBe("b");
        });
        test(`Should return null when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.after((item) => item === "c");
            expect(item).toBe(null);
        });
        test(`Should return null when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.after((item) => item === "d");
            expect(item).toBe(null);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "b", "c"]),
                indexes: Array<number> = [];
            collection.after((item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.after((item) => item === "a")).toBe("b");
            expect(collection.after((item) => item === "a")).toBe("b");
        });
    });
    describe("method: afterOr", () => {
        test(`Should return "c" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.afterOr(-1, (item) => item === "b");
            expect(item).toBe("c");
        });
        test(`Should return "b" when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.afterOr(-1, (item) => item === "a");
            expect(item).toBe("b");
        });
        describe(`Should return default value when searching for string "c" of ["a", "b", "c"]`, () => {
            test("Value", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.afterOr(-1, (item) => item === "c");
                expect(item).toBe(-1);
            });
            test("Function", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.afterOr(
                        () => -1,
                        (item) => item === "c",
                    );
                expect(item).toBe(-1);
            });
        });
        describe(`Should return default value when searching for string "d" of ["a", "b", "c"]`, () => {
            test("Value", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.afterOr(-1, (item) => item === "d");
                expect(item).toBe(-1);
            });
            test("Function", () => {
                const collection = new ListCollection(["a", "b", "c"]),
                    item = collection.afterOr(
                        () => -1,
                        (item) => item === "d",
                    );
                expect(item).toBe(-1);
            });
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "b", "c"]),
                indexes: Array<number> = [];
            collection.afterOr(null, (item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.afterOr(-1, (item) => item === "a")).toBe("b");
            expect(collection.afterOr(-1, (item) => item === "a")).toBe("b");
        });
    });
    describe("method: afterOrFail", () => {
        test(`Should return "c" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.afterOrFail((item) => item === "b");
            expect(item).toBe("c");
        });
        test(`Should return "b" when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]),
                item = collection.afterOrFail((item) => item === "a");
            expect(item).toBe("b");
        });
        test(`Should throw ItemNotFoundError when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(() => {
                collection.afterOrFail((item) => item === "d");
            }).toThrowError(ItemNotFoundCollectionError);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "b", "c"]),
                indexes: Array<number> = [];
            try {
                collection.afterOrFail((item, index) => {
                    indexes.push(index);
                    return item === "c";
                });
            } catch (error: unknown) {
                if (!(error instanceof ItemNotFoundCollectionError)) {
                    throw error;
                }
            }
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.afterOrFail((item) => item === "a")).toBe("b");
            expect(collection.afterOrFail((item) => item === "a")).toBe("b");
        });
    });
    describe("method: sole", () => {
        test("Should throw ItemNotFoundError when item does not exist", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(() => {
                collection.sole((item) => item === "f");
            }).toThrowError(ItemNotFoundCollectionError);
        });
        test("Should throw MultipleItemsFoundError when multiple item of same sort does exist", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(() => {
                collection.sole((item) => item === "a");
            }).toThrowError(MultipleItemsFoundCollectionError);
        });
        test("Should return item when only one item of the same sort exist", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(collection.sole((item) => item === "c")).toBe("c");
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]),
                indexes: Array<number> = [];
            collection.sole((item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(collection.sole((item) => item === "c")).toBe("c");
            expect(collection.sole((item) => item === "c")).toBe("c");
        });
    });
    describe("method: nth", () => {
        test("Should filter the 4:th items", () => {
            const collection = new ListCollection([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e",
                    "f",
                ]),
                newCollection = collection.nth(4);
            expect(newCollection.toArray()).toEqual(["a", "e"]);
        });
    });
    describe("method: count", () => {
        test(`Should return number 0 when filtering all string "a" of ["b", "b"]`, () => {
            const collection = new ListCollection(["b", "b"]);
            expect(collection.count((item) => item === "a")).toBe(0);
        });
        test(`Should return number 3 when filtering all string "a" of ["a", "b", "a", "b", "a"]`, () => {
            const collection = new ListCollection(["a", "b", "a", "b", "a"]);
            expect(collection.count((item) => item === "a")).toBe(3);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]),
                indexes: Array<number> = [];
            collection.count((_item, index) => {
                indexes.push(index);
                return true;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "a", "b", "a"]);
            expect(collection.count((item) => item === "a")).toBe(3);
            expect(collection.count((item) => item === "a")).toBe(3);
        });
    });
    describe("method: size", () => {
        test("Should return 0 when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.size()).toBe(0);
        });
        test("Should return number larger than 0 when empty", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.size()).toBeGreaterThan(0);
        });
        test("Should return 3 when contains 3 items", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.size()).toBe(3);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.size()).toBe(3);
            expect(collection.size()).toBe(3);
        });
    });
    describe("method: isEmpty", () => {
        test("Should return true when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.isEmpty()).toBe(true);
        });
        test("Should return false when not empty", () => {
            const collection = new ListCollection([""]);
            expect(collection.isEmpty()).toBe(false);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([]);
            expect(collection.isEmpty()).toBe(true);
            expect(collection.isEmpty()).toBe(true);
        });
    });
    describe("method: isNotEmpty", () => {
        test("Should return true when not empty", () => {
            const collection = new ListCollection([""]);
            expect(collection.isNotEmpty()).toBe(true);
        });
        test("Should return false when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.isNotEmpty()).toBe(false);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([""]);
            expect(collection.isNotEmpty()).toBe(true);
            expect(collection.isNotEmpty()).toBe(true);
        });
    });
    describe("method: searchFirst", () => {
        test("Should return -1 when searching for value that does not exist in collection", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.searchFirst((item) => item === "d")).toBe(-1);
        });
        test(`Should return 1 when searching for string "b" of ["a", "b", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "b", "c"]);
            expect(collection.searchFirst((item) => item === "b")).toBe(1);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "b", "c"]);
            expect(collection.searchFirst((item) => item === "b")).toBe(1);
            expect(collection.searchFirst((item) => item === "b")).toBe(1);
        });
    });
    describe("method: searchLast", () => {
        test("Should return -1 when searching for value that does not exist in collection", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.searchLast((item) => item === "d")).toBe(-1);
        });
        test(`Should return 2 when searching for string "b" of ["a", "b", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "b", "c"]);
            expect(collection.searchLast((item) => item === "b")).toBe(2);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "b", "c"]);
            expect(collection.searchLast((item) => item === "b")).toBe(2);
            expect(collection.searchLast((item) => item === "b")).toBe(2);
        });
    });
    describe("method: forEach", () => {
        test("Should iterate all items", () => {
            const arr1 = [1, 2, 3],
                collection = new ListCollection(arr1),
                arr2: Array<number> = [];
            collection.forEach((item) => arr2.push(item));
            expect(arr2).toEqual(arr1);
        });
        test("Should input correct indexes to predicate function", () => {
            const collection = new ListCollection([1, 2, 3]),
                indexes: Array<number> = [];
            collection.forEach((_item, index) => {
                indexes.push(index);
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const arr1 = [1, 2, 3],
                collection = new ListCollection(arr1),
                arr2: Array<number> = [];
            collection.forEach((item) => arr2.push(item));
            expect(arr2).toEqual(arr1);
            expect(arr2).toEqual(arr1);
        });
    });
    describe("method: toArray", () => {
        test("Should return array with 0 items when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.toArray()).toEqual([]);
        });
        test("Should return array with items when that match collection items", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.toArray()).toEqual(["a", "b", "c"]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.toArray()).toEqual(["a", "b", "c"]);
            expect(collection.toArray()).toEqual(["a", "b", "c"]);
        });
    });
    describe("method: toRecord", () => {
        test("Should throw TypeError when given an item that is not array", () => {
            const collection = new ListCollection(["a"]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is empty array", () => {
            const collection = new ListCollection([[]]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is array of size 1", () => {
            const collection = new ListCollection([["a"]]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is array of size 2 and where first item boolean", () => {
            const collection = new ListCollection([[false, "a"]]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is array of size 2 and where first item is a object", () => {
            const collection = new ListCollection([[{}, "a"]]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is array of size 2 and where first item is a function", () => {
            const collection = new ListCollection([[() => {}, "a"]]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is array of size 2 and where first item is a bigint", () => {
            const collection = new ListCollection([[1n, "a"]]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is array of size 2 and where first item is a null", () => {
            const collection = new ListCollection([[null, "a"]]);
            expect(() => collection.toRecord()).toThrowError(TypeError);
        });
        test("Should return Record when given items that is array of size 2 and where first items are string, number and symbols", () => {
            const MY_SYMBOL = Symbol("MY_SYMBOL");
            const collection = new ListCollection([
                ["a", 1],
                [1, "b"],
                [MY_SYMBOL, "c"],
            ]);
            expect(collection.toRecord()).toEqual({
                a: 1,
                1: "b",
                [MY_SYMBOL]: "c",
            });
        });
    });
    describe("method: toMap", () => {
        test("Should throw TypeError when given an item that is not array", () => {
            const collection = new ListCollection(["a"]);
            expect(() => collection.toMap()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is empty array", () => {
            const collection = new ListCollection([[]]);
            expect(() => collection.toMap()).toThrowError(TypeError);
        });
        test("Should throw TypeError when given an item that is array of size 1", () => {
            const collection = new ListCollection([["a"]]);
            expect(() => collection.toMap()).toThrowError(TypeError);
        });
        test("Should return Map when given items that is array of size 2", () => {
            const MY_SYMBOL = Symbol("MY_SYMBOL");
            const collection = new ListCollection([
                ["a", 1],
                [1, "b"],
                [MY_SYMBOL, "c"],
            ] as const);

            expect(collection.toMap()).toEqual(
                new Map<unknown, unknown>([
                    ["a", 1],
                    [1, "b"],
                    [MY_SYMBOL, "c"],
                ]),
            );
        });
    });
});

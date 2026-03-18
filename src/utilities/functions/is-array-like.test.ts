import { describe, expect, test } from "vitest";

import { isArrayLike } from "@/utilities/functions/is-array-like.js";

describe("function: isArrayLike", () => {
    test("Should return true when ArrayLike", () => {
        const arrayLike: ArrayLike<unknown> = {
            0: "a",
            1: "b",
            2: "c",
            length: 3,
        };

        const result = isArrayLike(arrayLike);

        expect(result).toBe(true);
    });
    test("Should return flase when AsyncIterable", () => {
        const asyncIterable: AsyncIterable<unknown> = {
            async *[Symbol.asyncIterator](): AsyncIterator<unknown> {
                yield Promise.resolve(1);
                yield Promise.resolve(2);
            },
        };

        const result = isArrayLike(asyncIterable);

        expect(result).toBe(false);
    });
    test("Should return false when Iterable", () => {
        const iterable: Iterable<unknown> = {
            *[Symbol.iterator](): Iterator<unknown> {
                yield 1;
                yield 2;
            },
        };

        const result = isArrayLike(iterable);

        expect(result).toBe(false);
    });
});

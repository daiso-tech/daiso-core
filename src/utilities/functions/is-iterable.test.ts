import { describe, expect, test } from "vitest";

import { isIterable } from "@/utilities/functions/is-iterable.js";

describe("function: isIterable", () => {
    test("Should return true when Iterable", () => {
        const iterable: Iterable<unknown> = {
            *[Symbol.iterator](): Iterator<unknown> {
                yield 1;
                yield 2;
            },
        };

        const result = isIterable(iterable);

        expect(result).toBe(true);
    });
    test("Should return false when AsyncIterable", () => {
        const asyncIterable: AsyncIterable<unknown> = {
            async *[Symbol.asyncIterator](): AsyncIterator<unknown> {
                yield Promise.resolve(1);
                yield Promise.resolve(2);
            },
        };

        const result = isIterable(asyncIterable);

        expect(result).toBe(false);
    });
    test("Should return false when ArrayLike", () => {
        const arrayLike: ArrayLike<unknown> = {
            0: "a",
            1: "b",
            2: "c",
            length: 3,
        };

        const result = isIterable(arrayLike);

        expect(result).toBe(false);
    });
});

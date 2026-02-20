import { describe, expect, test } from "vitest";

import { isAsyncIterable } from "@/utilities/functions/is-async-iterable.js";

describe("function: isAsyncIterable", () => {
    test("Should return true when AsyncIterable", () => {
        const asyncIterable: AsyncIterable<unknown> = {
            async *[Symbol.asyncIterator](): AsyncIterator<unknown> {
                yield Promise.resolve(1);
                yield Promise.resolve(2);
            },
        };

        const result = isAsyncIterable(asyncIterable);

        expect(result).toBe(true);
    });
    test("Should return false when Iterable", () => {
        const iterable: Iterable<unknown> = {
            *[Symbol.iterator](): Iterator<unknown> {
                yield 1;
                yield 2;
            },
        };

        const result = isAsyncIterable(iterable);

        expect(result).toBe(false);
    });
    test("Should return false when ArrayLike", () => {
        const arrayLike: ArrayLike<unknown> = {
            0: "a",
            1: "b",
            2: "c",
            length: 3,
        };

        const result = isAsyncIterable(arrayLike);

        expect(result).toBe(false);
    });
});

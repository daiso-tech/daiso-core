import { describe, expect, test } from "vitest";

import {
    isCacheError,
    KeyExistsCacheError,
    KeyNotFoundCacheError,
} from "@/cache/contracts/cache.errors.js";

describe("file: cache.errors.ts", () => {
    describe("function: isCacheError", () => {
        test("Should return true when given KeyNotFoundCacheError instance", () => {
            const error = KeyNotFoundCacheError.create("a");
            expect(isCacheError(error)).toBe(true);
        });
        test("Should return true when given KeyExistsCacheError instance", () => {
            const error = KeyExistsCacheError.create("a");
            expect(isCacheError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isCacheError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isCacheError("")).toBe(false);
            expect(isCacheError(null)).toBe(false);
        });
    });
});

import { describe, expect, test } from "vitest";

import {
    EmptyCollectionError,
    isCollectionError,
    ItemNotFoundCollectionError,
    MultipleItemsFoundCollectionError,
} from "@/collection/contracts/collection.errors.js";

describe("file: collection.errors.ts", () => {
    describe("function: isCollectionError", () => {
        test("Should return true when given ItemNotFoundCollectionError instance", () => {
            const error = ItemNotFoundCollectionError.create();
            expect(isCollectionError(error)).toBe(true);
        });
        test("Should return true when given MultipleItemsFoundCollectionError instance", () => {
            const error = MultipleItemsFoundCollectionError.create();
            expect(isCollectionError(error)).toBe(true);
        });
        test("Should return true when given EmptyCollectionError instance", () => {
            const error = EmptyCollectionError.create();
            expect(isCollectionError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isCollectionError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isCollectionError("")).toBe(false);
            expect(isCollectionError(null)).toBe(false);
        });
    });
});

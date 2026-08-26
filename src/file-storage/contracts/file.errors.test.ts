import { describe, expect, test } from "vitest";

import {
    InvalidKeyFileError,
    isFileError,
    KeyExistsFileError,
    KeyNotFoundFileError,
} from "@/file-storage/contracts/file.errors.js";

describe("file: file.errors.ts", () => {
    describe("function: isFileError", () => {
        test("Should return true when given KeyNotFoundFileError instance", () => {
            const error = KeyNotFoundFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given KeyExistsFileError instance", () => {
            const error = KeyExistsFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given InvalidKeyFileError instance", () => {
            const error = InvalidKeyFileError.create("invalid");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isFileError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isFileError("")).toBe(false);
            expect(isFileError(null)).toBe(false);
        });
    });
});

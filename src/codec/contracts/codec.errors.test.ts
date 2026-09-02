import { describe, expect, test } from "vitest";

import {
    DecodingError,
    EncodingError,
    isCodecError,
} from "@/codec/contracts/codec.errors.js";

describe("file: codec.errors.ts", () => {
    describe("function: isCodecError", () => {
        test("Should return true when given EncodingError instance", () => {
            const error = EncodingError.create("boom");
            expect(isCodecError(error)).toBe(true);
        });
        test("Should return true when given DecodingError instance", () => {
            const error = DecodingError.create("boom");
            expect(isCodecError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isCodecError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isCodecError("")).toBe(false);
            expect(isCodecError(null)).toBe(false);
        });
    });
});

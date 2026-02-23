import { describe, expect, test } from "vitest";

import { isArrayBufferLikeable } from "@/file-storage/implementations/derivables/file-storage/is-array-buffer-likeable.js";

describe("function: isArrayBufferLikeable", () => {
    test("Should return false when given ArrayBuffer", () => {
        const result = isArrayBufferLikeable(new ArrayBuffer(2));
        expect(result).toBe(false);
    });
    test("Should return true when given Buffer", () => {
        const result = isArrayBufferLikeable(Buffer.from([]));
        expect(result).toBe(true);
    });
    test("Should return true when given Uint8Array", () => {
        const result = isArrayBufferLikeable(new Uint8Array());
        expect(result).toBe(true);
    });
    test("Should return true when given Int8Array", () => {
        const result = isArrayBufferLikeable(new Int8Array());
        expect(result).toBe(true);
    });
    test("Should return true when given Uint16Array", () => {
        const result = isArrayBufferLikeable(new Uint16Array());
        expect(result).toBe(true);
    });
    test("Should return true when given Int16Array", () => {
        const result = isArrayBufferLikeable(new Int16Array());
        expect(result).toBe(true);
    });
    test("Should return true when given Uint32Array", () => {
        const result = isArrayBufferLikeable(new Uint32Array());
        expect(result).toBe(true);
    });
    test("Should return true when given Int32Array", () => {
        const result = isArrayBufferLikeable(new Int32Array());
        expect(result).toBe(true);
    });
    test("Should return true when given BigUint64Array", () => {
        const result = isArrayBufferLikeable(new BigUint64Array());
        expect(result).toBe(true);
    });
    test("Should return true when given BigInt64Array", () => {
        const result = isArrayBufferLikeable(new BigInt64Array());
        expect(result).toBe(true);
    });
    test("Should return true when given Float32Array", () => {
        const result = isArrayBufferLikeable(new Float32Array());
        expect(result).toBe(true);
    });
    test("Should return true when given Float64Array", () => {
        const result = isArrayBufferLikeable(new Float64Array());
        expect(result).toBe(true);
    });
});

import { describe, expect, test } from "vitest";

import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";

describe("function: resolveFileContent", () => {
    test("Should convert string to Uint8Array", () => {
        const input = "abc";
        const result = resolveFileContent(input);
        expect(result).toEqual(new Uint8Array([97, 98, 99]));
    });
    test.todo("Should convert Buffer to Uint8Array", () => {
        // Buffers are often slices of a larger internal ArrayBuffer
        const input = Buffer.from([0x01, 0x02]);
        const result = resolveFileContent(input);

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.byteLength).toBe(2);
        expect(Array.from(result)).toEqual([1, 2]);
    });
    test("Should convert ArrayBuffer to Uint8Array", () => {
        const buffer = new ArrayBuffer(2);
        const view = new Uint8Array(buffer);
        view[0] = 0xaa;
        view[1] = 0xbb;

        const result = resolveFileContent(buffer);
        expect(Array.from(result)).toEqual([0xaa, 0xbb]);
    });
    test("Should convert Uint8Array to Uint8Array", () => {
        const input = new Uint8Array([10, 20]);
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([10, 20]);
    });
    test("Should convert Int8Array to Uint8Array", () => {
        const input = new Int8Array([-1, 127]);
        const result = resolveFileContent(input);
        // -1 (signed) is 255 (unsigned)
        expect(Array.from(result)).toEqual([255, 127]);
    });
    test("Should convert Uint16Array to Uint8Array", () => {
        const input = new Uint16Array([0x0102]);
        const result = resolveFileContent(input);
        // Assumes Little Endian
        expect(Array.from(result)).toEqual([0x02, 0x01]);
    });
    test("Should convert Int16Array to Uint8Array", () => {
        const input = new Int16Array([-1]);
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([255, 255]);
    });
    test("Should convert Uint32Array to Uint8Array", () => {
        const input = new Uint32Array([0x11223344]);
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([0x44, 0x33, 0x22, 0x11]);
    });
    test("Should convert Int32Array to Uint8Array", () => {
        const input = new Int32Array([-1]);
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([255, 255, 255, 255]);
    });
    test("Should convert BigUint64Array to Uint8Array", () => {
        const input = new BigUint64Array([0x0102030405060708n]);
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    });
    test("Should convert BigInt64Array to Uint8Array", () => {
        const input = new BigInt64Array([-1n]);
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([
            255, 255, 255, 255, 255, 255, 255, 255,
        ]);
    });
    test("Should convert Float32Array to Uint8Array", () => {
        const input = new Float32Array([1.0]); // 0x3F800000
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([0, 0, 128, 63]);
    });
    test("Should convert Float64Array to Uint8Array", () => {
        const input = new Float64Array([1.0]); // 0x3FF0000000000000
        const result = resolveFileContent(input);
        expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 240, 63]);
    });
});

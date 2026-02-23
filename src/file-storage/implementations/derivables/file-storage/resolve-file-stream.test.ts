import { describe, expect, test } from "vitest";

import { AsyncIterableCollection } from "@/collection/implementations/_module-exports.js";
import { ResolveFileStream } from "@/file-storage/implementations/derivables/file-storage/resolve-file-stream.js";

describe("function: resolveFileStream", () => {
    test("Should convert string to Uint8Array", async () => {
        const input: AsyncIterable<string> = {
            async *[Symbol.asyncIterator](): AsyncIterator<string> {
                yield Promise.resolve("abc");
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(result).toEqual(new Uint8Array([97, 98, 99]));
    });
    test.todo("Should convert Buffer to Uint8Array", async () => {
        // Buffers are often slices of a larger internal ArrayBuffer
        const input: AsyncIterable<Buffer> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Buffer> {
                yield Promise.resolve(Buffer.from([0x01, 0x02]));
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.byteLength).toBe(2);
        expect(Array.from(result)).toEqual([1, 2]);
    });
    test("Should convert ArrayBuffer to Uint8Array", async () => {
        const input: AsyncIterable<ArrayBuffer> = {
            async *[Symbol.asyncIterator](): AsyncIterator<ArrayBuffer> {
                const buffer = new ArrayBuffer(2);
                const view = new Uint8Array(buffer);
                view[0] = 0xaa;
                view[1] = 0xbb;
                yield Promise.resolve(buffer);
            },
        };

        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([0xaa, 0xbb]);
    });
    test("Should convert Uint8Array to Uint8Array", async () => {
        const input: AsyncIterable<Uint8Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                yield Promise.resolve(new Uint8Array([10, 20]));
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([10, 20]);
    });
    test("Should convert Int8Array to Uint8Array", async () => {
        const input: AsyncIterable<Int8Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Int8Array> {
                yield Promise.resolve(new Int8Array([-1, 127]));
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        // -1 (signed) is 255 (unsigned)
        expect(Array.from(result)).toEqual([255, 127]);
    });
    test("Should convert Uint16Array to Uint8Array", async () => {
        const input: AsyncIterable<Uint16Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Uint16Array> {
                yield Promise.resolve(new Uint16Array([0x0102]));
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        // Assumes Little Endian
        expect(Array.from(result)).toEqual([0x02, 0x01]);
    });
    test("Should convert Int16Array to Uint8Array", async () => {
        const input: AsyncIterable<Int16Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Int16Array> {
                yield Promise.resolve(new Int16Array([-1]));
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([255, 255]);
    });
    test("Should convert Uint32Array to Uint8Array", async () => {
        const input: AsyncIterable<Uint32Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Uint32Array> {
                yield Promise.resolve(new Uint32Array([0x11223344]));
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([0x44, 0x33, 0x22, 0x11]);
    });
    test("Should convert Int32Array to Uint8Array", async () => {
        const input: AsyncIterable<Int32Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Int32Array> {
                yield Promise.resolve(new Int32Array([-1]));
                throw new Error("Function not implemented.");
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([255, 255, 255, 255]);
    });
    test("Should convert BigUint64Array to Uint8Array", async () => {
        const input: AsyncIterable<BigUint64Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<BigUint64Array> {
                yield Promise.resolve(
                    new BigUint64Array([0x0102030405060708n]),
                );
                throw new Error("Function not implemented.");
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    });
    test("Should convert BigInt64Array to Uint8Array", async () => {
        const input: AsyncIterable<BigInt64Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<BigInt64Array> {
                yield Promise.resolve(new BigInt64Array([-1n]));
                throw new Error("Function not implemented.");
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([
            255, 255, 255, 255, 255, 255, 255, 255,
        ]);
    });
    test("Should convert Float32Array to Uint8Array", async () => {
        const input: AsyncIterable<Float32Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Float32Array> {
                yield Promise.resolve(new Float32Array([1.0])); // 0x3F800000
                throw new Error("Function not implemented.");
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([0, 0, 128, 63]);
    });
    test("Should convert Float64Array to Uint8Array", async () => {
        const input: AsyncIterable<Float64Array> = {
            async *[Symbol.asyncIterator](): AsyncIterator<Float64Array> {
                yield Promise.resolve(new Float64Array([1.0])); // 0x3FF0000000000000
                throw new Error("Function not implemented.");
            },
        };
        const result = await new AsyncIterableCollection(
            new ResolveFileStream(input),
        ).firstOrFail();
        expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 240, 63]);
    });
});

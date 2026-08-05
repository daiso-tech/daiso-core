/**
 * @module HttpRouter
 */

import { describe, expect, test, vi } from "vitest";

import {
    EmptyFileCollectionError,
    FileIndexOutOfBoundsError,
} from "@/http-router/contracts/_module.js";
import { HttpFileCollection } from "@/http-router/implementations/http-file-collection.js";

import type { IHttpFile } from "@/http-router/contracts/_module.js";

function createMockFile(name: string): IHttpFile {
    const file = new File([name], name);
    return {
        name: file.name,
        contentType: file.type,
        lastModified: new Date(file.lastModified),
        fileSize: {
            toBytes: vi.fn(() => file.size),
        } as unknown as IHttpFile["fileSize"],
        asText: vi.fn(() => file.text()),
        asBytes: vi.fn(() => file.bytes()),
        asArrayBuffer: vi.fn(() => file.arrayBuffer()),
        asReadableStream: vi.fn(() => file.stream()),
        asFile: vi.fn(() => file),
        [Symbol.asyncIterator]: vi.fn(() =>
            file.stream()[Symbol.asyncIterator](),
        ),
    };
}

function getThrownError<T = Error>(fn: () => unknown): T {
    try {
        fn();
    } catch (error: unknown) {
        return error as T;
    }
    throw new Error("Expected function to throw");
}

describe("class: HttpFileCollection", () => {
    describe("constructor", () => {
        test("Should create an empty collection that reports isEmpty as true", () => {
            const collection = new HttpFileCollection("avatar", []);
            expect(collection.isEmpty).toBe(true);
            expect(collection.count).toBe(0);
        });

        test("Should create a non-empty collection with the provided files", () => {
            const files = [createMockFile("a.txt")];
            const collection = new HttpFileCollection("docs", files);
            expect(collection.isEmpty).toBe(false);
            expect(collection.count).toBe(1);
        });
    });

    describe("property: count", () => {
        test("Should return 0 for an empty collection", () => {
            const collection = new HttpFileCollection("avatar", []);
            expect(collection.count).toBe(0);
        });

        test("Should return the number of files in the collection", () => {
            const files = [createMockFile("a.txt"), createMockFile("b.txt")];
            const collection = new HttpFileCollection("docs", files);
            expect(collection.count).toBe(2);
        });

        test("Should return 1 for a single-file collection", () => {
            const collection = new HttpFileCollection("avatar", [
                createMockFile("photo.png"),
            ]);
            expect(collection.count).toBe(1);
        });
    });

    describe("property: isEmpty", () => {
        test("Should return true when the collection has no files", () => {
            const collection = new HttpFileCollection("avatar", []);
            expect(collection.isEmpty).toBe(true);
        });

        test("Should return false when the collection has files", () => {
            const collection = new HttpFileCollection("avatar", [
                createMockFile("photo.png"),
            ]);
            expect(collection.isEmpty).toBe(false);
        });
    });

    describe("method: get", () => {
        test("Should return the file at the given index", () => {
            const fileA = createMockFile("a.txt");
            const fileB = createMockFile("b.txt");
            const collection = new HttpFileCollection("docs", [fileA, fileB]);
            expect(collection.get(0)).toBe(fileA);
            expect(collection.get(1)).toBe(fileB);
        });

        test("Should return null when the index is out of bounds (negative)", () => {
            const collection = new HttpFileCollection("docs", [
                createMockFile("a.txt"),
            ]);
            expect(collection.get(-1)).toBeNull();
        });

        test("Should return null when the index is out of bounds (beyond length)", () => {
            const collection = new HttpFileCollection("docs", [
                createMockFile("a.txt"),
            ]);
            expect(collection.get(5)).toBeNull();
        });

        test("Should return null for an empty collection", () => {
            const collection = new HttpFileCollection("empty", []);
            expect(collection.get(0)).toBeNull();
        });
    });

    describe("method: getOrFail", () => {
        test("Should return the file at the given index when valid", () => {
            const file = createMockFile("a.txt");
            const collection = new HttpFileCollection("docs", [file]);
            expect(collection.getOrFail(0)).toBe(file);
        });

        test("Should throw FileIndexOutOfBoundsError when index is out of bounds", () => {
            const collection = new HttpFileCollection("myfield", [
                createMockFile("a.txt"),
            ]);
            expect(() => collection.getOrFail(5)).toThrow(
                FileIndexOutOfBoundsError,
            );
        });

        test("Should include the field name in the error message", () => {
            const collection = new HttpFileCollection("myfield", []);
            const error = getThrownError<FileIndexOutOfBoundsError>(() =>
                collection.getOrFail(0),
            );
            expect(error).toBeInstanceOf(FileIndexOutOfBoundsError);
            expect(error.message).toContain("myfield");
        });

        test("Should include the index in the error message", () => {
            const collection = new HttpFileCollection("field", []);
            const error = getThrownError<FileIndexOutOfBoundsError>(() =>
                collection.getOrFail(3),
            );
            expect(error).toBeInstanceOf(FileIndexOutOfBoundsError);
            expect(error.message).toContain("3");
        });
    });

    describe("method: first", () => {
        test("Should return the first file in the collection", () => {
            const first = createMockFile("first.txt");
            const second = createMockFile("second.txt");
            const collection = new HttpFileCollection("docs", [first, second]);
            expect(collection.first()).toBe(first);
        });

        test("Should return null when the collection is empty", () => {
            const collection = new HttpFileCollection("docs", []);
            expect(collection.first()).toBeNull();
        });

        test("Should return the only file when the collection has one file", () => {
            const file = createMockFile("only.txt");
            const collection = new HttpFileCollection("docs", [file]);
            expect(collection.first()).toBe(file);
        });
    });

    describe("method: firstOrFail", () => {
        test("Should return the first file when the collection is non-empty", () => {
            const file = createMockFile("a.txt");
            const collection = new HttpFileCollection("docs", [file]);
            expect(collection.firstOrFail()).toBe(file);
        });

        test("Should throw EmptyFileCollectionError when the collection is empty", () => {
            const collection = new HttpFileCollection("myfield", []);
            expect(() => collection.firstOrFail()).toThrow(
                EmptyFileCollectionError,
            );
        });

        test("Should include the field name in the EmptyFileCollectionError message", () => {
            const collection = new HttpFileCollection("avatar", []);
            const error = getThrownError<EmptyFileCollectionError>(() =>
                collection.firstOrFail(),
            );
            expect(error).toBeInstanceOf(EmptyFileCollectionError);
            expect(error.message).toContain("avatar");
        });
    });

    describe("Symbol.iterator", () => {
        test("Should be iterable with for...of", () => {
            const fileA = createMockFile("a.txt");
            const fileB = createMockFile("b.txt");
            const collection = new HttpFileCollection("docs", [fileA, fileB]);

            const collected: Array<IHttpFile> = [];
            for (const file of collection) {
                collected.push(file);
            }
            expect(collected).toHaveLength(2);
            expect(collected[0]).toBe(fileA);
            expect(collected[1]).toBe(fileB);
        });

        test("Should yield no items for an empty collection", () => {
            const collection = new HttpFileCollection("empty", []);
            const collected: Array<IHttpFile> = [];
            for (const file of collection) {
                collected.push(file);
            }
            expect(collected).toHaveLength(0);
        });

        test("Should work with spread operator", () => {
            const fileA = createMockFile("a.txt");
            const fileB = createMockFile("b.txt");
            const collection = new HttpFileCollection("docs", [fileA, fileB]);
            const spread = [...collection];
            expect(spread).toHaveLength(2);
        });
    });
});

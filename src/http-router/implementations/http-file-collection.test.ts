/**
 * @module HttpRouter
 */

import { describe, expect, test } from "vitest";

import { HttpError } from "@/http-router/contracts/_module.js";
import { HttpFileCollection } from "@/http-router/implementations/http-file-collection.js";
import { HttpFile } from "@/http-router/implementations/http-file.js";

import type { IHttpFile } from "@/http-router/contracts/_module.js";

describe("class: HttpFileCollection", () => {
    describe("constructor", () => {
        test("Should create an empty collection that reports isEmpty() as true", () => {
            const collection = new HttpFileCollection("avatar", []);
            expect(collection.isEmpty()).toBe(true);
            expect(collection.size()).toBe(0);
        });

        test("Should create a non-empty collection with the provided files", () => {
            const files = [new HttpFile(new File(["a.txt"], "a.txt"))];
            const collection = new HttpFileCollection("docs", files);
            expect(collection.isEmpty()).toBe(false);
            expect(collection.size()).toBe(1);
        });
    });

    describe("property: size()", () => {
        test("Should return 0 for an empty collection", () => {
            const collection = new HttpFileCollection("avatar", []);
            expect(collection.size()).toBe(0);
        });

        test("Should return the number of files in the collection", () => {
            const files = [
                new HttpFile(new File(["a.txt"], "a.txt")),
                new HttpFile(new File(["b.txt"], "b.txt")),
            ];
            const collection = new HttpFileCollection("docs", files);
            expect(collection.size()).toBe(2);
        });

        test("Should return 1 for a single-file collection", () => {
            const collection = new HttpFileCollection("avatar", [
                new HttpFile(new File(["photo.png"], "photo.png")),
            ]);
            expect(collection.size()).toBe(1);
        });
    });

    describe("property: isEmpty()", () => {
        test("Should return true when the collection has no files", () => {
            const collection = new HttpFileCollection("avatar", []);
            expect(collection.isEmpty()).toBe(true);
        });

        test("Should return false when the collection has files", () => {
            const collection = new HttpFileCollection("avatar", [
                new HttpFile(new File(["photo.png"], "photo.png")),
            ]);
            expect(collection.isEmpty()).toBe(false);
        });
    });

    describe("method: get", () => {
        test("Should return the file at the given index", () => {
            const fileA = new HttpFile(new File(["a.txt"], "a.txt"));
            const fileB = new HttpFile(new File(["b.txt"], "b.txt"));
            const collection = new HttpFileCollection("docs", [fileA, fileB]);
            expect(collection.get(0)).toBe(fileA);
            expect(collection.get(1)).toBe(fileB);
        });

        test("Should return null when the index is out of bounds (negative)", () => {
            const collection = new HttpFileCollection("docs", [
                new HttpFile(new File(["a.txt"], "a.txt")),
            ]);
            expect(collection.get(-1)).toBeNull();
        });

        test("Should return null when the index is out of bounds (beyond length)", () => {
            const collection = new HttpFileCollection("docs", [
                new HttpFile(new File(["a.txt"], "a.txt")),
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
            const file = new HttpFile(new File(["a.txt"], "a.txt"));
            const collection = new HttpFileCollection("docs", [file]);
            expect(collection.getOrFail(0)).toBe(file);
        });

        test("Should throw HttpError when index is out of bounds", () => {
            const collection = new HttpFileCollection("myfield", [
                new HttpFile(new File(["a.txt"], "a.txt")),
            ]);
            expect(() => collection.getOrFail(5)).toThrow(HttpError);
            expect(() => collection.getOrFail(5)).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });

        test("Should include the field name in the error message", () => {
            const collection = new HttpFileCollection("myfield", []);
            expect(() => collection.getOrFail(0)).toThrow(HttpError);
            expect(() => collection.getOrFail(0)).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });

        test("Should include the index in the error message", () => {
            const collection = new HttpFileCollection("field", []);
            expect(() => collection.getOrFail(3)).toThrow(HttpError);
            expect(() => collection.getOrFail(3)).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });

    describe("method: first", () => {
        test("Should return the first file in the collection", () => {
            const first = new HttpFile(new File(["first.txt"], "first.txt"));
            const second = new HttpFile(new File(["second.txt"], "second.txt"));
            const collection = new HttpFileCollection("docs", [first, second]);
            expect(collection.first()).toBe(first);
        });

        test("Should return null when the collection is empty", () => {
            const collection = new HttpFileCollection("docs", []);
            expect(collection.first()).toBeNull();
        });

        test("Should return the only file when the collection has one file", () => {
            const file = new HttpFile(new File(["only.txt"], "only.txt"));
            const collection = new HttpFileCollection("docs", [file]);
            expect(collection.first()).toBe(file);
        });
    });

    describe("method: firstOrFail", () => {
        test("Should return the first file when the collection is non-empty", () => {
            const file = new HttpFile(new File(["a.txt"], "a.txt"));
            const collection = new HttpFileCollection("docs", [file]);
            expect(collection.firstOrFail()).toBe(file);
        });

        test("Should throw HttpError when the collection is empty", () => {
            const collection = new HttpFileCollection("myfield", []);
            expect(() => collection.firstOrFail()).toThrow(HttpError);
            expect(() => collection.firstOrFail()).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });

        test("Should include the field name in the HttpError message", () => {
            const collection = new HttpFileCollection("avatar", []);
            expect(() => collection.firstOrFail()).toThrow(HttpError);
            expect(() => collection.firstOrFail()).toThrow(
                expect.objectContaining({
                    status: "400",
                }),
            );
        });
    });

    describe("Symbol.iterator", () => {
        test("Should be iterable with for...of", () => {
            const fileA = new HttpFile(new File(["a.txt"], "a.txt"));
            const fileB = new HttpFile(new File(["b.txt"], "b.txt"));
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
            const fileA = new HttpFile(new File(["a.txt"], "a.txt"));
            const fileB = new HttpFile(new File(["b.txt"], "b.txt"));
            const collection = new HttpFileCollection("docs", [fileA, fileB]);
            const spread = [...collection];
            expect(spread).toHaveLength(2);
        });
    });
});

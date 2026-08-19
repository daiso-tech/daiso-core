import { describe, expect, test } from "vitest";

import { defaultKeyValidator } from "@/file-storage/implementations/plugins/with-file-storage-key-validator/default-key-validator.js";

describe("function: defaultKeyValidator", () => {
    test("Should return null for a valid key", () => {
        expect(defaultKeyValidator("folder/file.txt")).toBeNull();
    });
    test("Should return null for a key with a dotted filename", () => {
        expect(defaultKeyValidator("folder/file..txt")).toBeNull();
    });
    test("Should return null for a key starting with a dotted filename", () => {
        expect(defaultKeyValidator("..hidden/file.txt")).toBeNull();
    });
    test("Should return a message for a key with a leading parent directory segment", () => {
        expect(defaultKeyValidator("../secret.txt")).toBe(
            `The key cannot contain "../"`,
        );
    });
    test("Should return a message for a key with a nested parent directory segment", () => {
        expect(defaultKeyValidator("folder/../secret.txt")).toBe(
            `The key cannot contain "../"`,
        );
    });
    test("Should return a message for a key with a backslash parent directory segment", () => {
        expect(defaultKeyValidator("..\\secret.txt")).toBe(
            `The key cannot contain "../"`,
        );
    });
    test("Should return a message for a key with a nested backslash parent directory segment", () => {
        expect(defaultKeyValidator("folder\\..\\secret.txt")).toBe(
            `The key cannot contain "../"`,
        );
    });
    test("Should return a message for a key with multiple parent directory segments", () => {
        expect(defaultKeyValidator("a/../../b")).toBe(
            `The key cannot contain "../"`,
        );
    });
    test("Should return a message for a key that is only a parent directory segment", () => {
        expect(defaultKeyValidator("..")).toBe(`The key cannot contain "../"`);
    });
    test("Should return a message for a key containing a newline", () => {
        expect(defaultKeyValidator("folder/\nfile.txt")).toBe(
            `The key cannot contain "\\n"`,
        );
    });
    test("Should return a message for a key containing a tab", () => {
        expect(defaultKeyValidator("folder/\tfile.txt")).toBe(
            `The key cannot contain "\\t"`,
        );
    });
    test("Should return a message for a key with only spaces", () => {
        expect(defaultKeyValidator("   ")).toBe(
            "The key cannot contain only spaces or be an empty string",
        );
    });
    test("Should return a message for an empty key", () => {
        expect(defaultKeyValidator("")).toBe(
            "The key cannot contain only spaces or be an empty string",
        );
    });
});

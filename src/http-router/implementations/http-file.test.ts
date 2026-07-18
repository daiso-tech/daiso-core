/**
 * @module HttpRouter
 */

import { describe, expect, test, vi } from "vitest";

import { FileSize } from "@/file-size/implementations/_module.js";
import { HttpFile } from "@/http-router/implementations/http-file.js";

describe("class: HttpFile", () => {
    function createTestFile(
        name = "test.txt",
        type = "text/plain",
        content = "hello world",
    ): File {
        return new File([content], name, { type, lastModified: 1000 });
    }

    describe("property: name", () => {
        test("Should delegate to the underlying File.name", () => {
            const file = createTestFile("document.pdf");
            const nameSpy = vi.spyOn(file, "name", "get");
            const httpFile = new HttpFile(file);

            const result = httpFile.name;

            expect(nameSpy).toHaveBeenCalled();
            expect(result).toBe("document.pdf");
        });

        test("Should return an empty string when the file has no name", () => {
            const file = createTestFile("");
            const httpFile = new HttpFile(file);
            expect(httpFile.name).toBe("");
        });

        test("Should preserve special characters in the file name", () => {
            const file = createTestFile("résumé (final).pdf");
            const httpFile = new HttpFile(file);
            expect(httpFile.name).toBe("résumé (final).pdf");
        });
    });

    describe("property: contentType", () => {
        test("Should return the file's MIME type", () => {
            const file = createTestFile("image.png", "image/png");
            const httpFile = new HttpFile(file);
            expect(httpFile.contentType).toBe("image/png");
        });

        test("Should return an empty string when the content type is not set", () => {
            const file = createTestFile("data.bin", "");
            const httpFile = new HttpFile(file);
            expect(httpFile.contentType).toBe("");
        });
    });

    describe("property: lastModified", () => {
        test("Should return a Date from the file's lastModified timestamp", () => {
            const file = createTestFile("test.txt", "text/plain");
            const lmSpy = vi.spyOn(file, "lastModified", "get");
            const httpFile = new HttpFile(file);

            const result = httpFile.lastModified;

            expect(lmSpy).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBe(1000);
        });
    });

    describe("property: fileSize", () => {
        test("Should return a FileSize from FileSize.fromBytes", () => {
            const file = createTestFile("data.txt", "text/plain", "hello");
            const fromBytesSpy = vi.spyOn(FileSize, "fromBytes");
            const httpFile = new HttpFile(file);

            const result = httpFile.fileSize;

            expect(fromBytesSpy).toHaveBeenCalledWith(5);
            expect(result).toBeInstanceOf(FileSize);
            expect(result.toBytes()).toBe(5);
        });

        test("Should return FileSize of zero for an empty file", () => {
            const file = createTestFile("empty.txt", "text/plain", "");
            const httpFile = new HttpFile(file);
            expect(httpFile.fileSize.toBytes()).toBe(0);
        });
    });

    describe("method: asText", () => {
        test("Should delegate to file.text() and return a string", async () => {
            const file = createTestFile(
                "test.txt",
                "text/plain",
                "hello world",
            );
            const textSpy = vi.spyOn(file, "text");
            const httpFile = new HttpFile(file);

            const text = await httpFile.asText();

            expect(textSpy).toHaveBeenCalledTimes(1);
            expect(text).toBe("hello world");
        });

        test("Should return an empty string for an empty file", async () => {
            const file = createTestFile("empty.txt", "text/plain", "");
            const httpFile = new HttpFile(file);
            const text = await httpFile.asText();
            expect(text).toBe("");
        });

        test("Should handle unicode content", async () => {
            const content = "こんにちは世界";
            const file = createTestFile("unicode.txt", "text/plain", content);
            const httpFile = new HttpFile(file);
            const text = await httpFile.asText();
            expect(text).toBe(content);
        });
    });

    describe("method: asBytes", () => {
        test("Should delegate to file.bytes() and return Uint8Array", async () => {
            const file = createTestFile(
                "test.bin",
                "application/octet-stream",
                "hello",
            );
            const bytesSpy = vi.spyOn(file, "bytes");
            const httpFile = new HttpFile(file);

            const bytes = await httpFile.asBytes();

            expect(bytesSpy).toHaveBeenCalledTimes(1);
            expect(bytes).toBeInstanceOf(Uint8Array);
            expect(new TextDecoder().decode(bytes)).toBe("hello");
        });

        test("Should return an empty Uint8Array for an empty file", async () => {
            const file = createTestFile(
                "empty.bin",
                "application/octet-stream",
                "",
            );
            const httpFile = new HttpFile(file);
            const bytes = await httpFile.asBytes();
            expect(bytes).toBeInstanceOf(Uint8Array);
            expect(bytes.length).toBe(0);
        });
    });

    describe("method: asArrayBuffer", () => {
        test("Should delegate to file.arrayBuffer()", async () => {
            const file = createTestFile(
                "test.bin",
                "application/octet-stream",
                "data",
            );
            const abSpy = vi.spyOn(file, "arrayBuffer");
            const httpFile = new HttpFile(file);

            const buffer = await httpFile.asArrayBuffer();

            expect(abSpy).toHaveBeenCalledTimes(1);
            expect(buffer).toBeInstanceOf(ArrayBuffer);
            expect(buffer.byteLength).toBe(4);
        });

        test("Should return an empty ArrayBuffer for an empty file", async () => {
            const file = createTestFile(
                "empty.bin",
                "application/octet-stream",
                "",
            );
            const httpFile = new HttpFile(file);
            const buffer = await httpFile.asArrayBuffer();
            expect(buffer.byteLength).toBe(0);
        });
    });

    describe("method: asReadableStream", () => {
        test("Should delegate to file.stream() and return a ReadableStream", async () => {
            const file = createTestFile(
                "stream.txt",
                "text/plain",
                "streaming content",
            );
            const streamSpy = vi.spyOn(file, "stream");
            const httpFile = new HttpFile(file);

            const stream = httpFile.asReadableStream();

            expect(streamSpy).toHaveBeenCalledTimes(1);
            expect(stream).toBeInstanceOf(ReadableStream);
            const reader = stream.getReader();
            const { value, done } = await reader.read();
            expect(done).toBe(false);
            expect(new TextDecoder().decode(value)).toBe("streaming content");
        });
    });

    describe("method: asFile", () => {
        test("Should return the underlying File object", () => {
            const file = createTestFile("original.txt");
            const httpFile = new HttpFile(file);
            expect(httpFile.asFile()).toBe(file);
        });

        test("Should return the File with correct properties preserved", () => {
            const file = createTestFile("myfile.txt", "text/plain", "content");
            const httpFile = new HttpFile(file);
            const returned = httpFile.asFile();
            expect(returned.name).toBe("myfile.txt");
            expect(returned.type).toBe("text/plain");
        });
    });

    describe("Symbol.asyncIterator", () => {
        test("Should delegate to file.stream() for async iteration", async () => {
            const content = "line1\nline2\nline3";
            const file = createTestFile("lines.txt", "text/plain", content);
            const streamSpy = vi.spyOn(file, "stream");
            const httpFile = new HttpFile(file);

            const chunks: Array<Uint8Array> = [];
            for await (const chunk of httpFile) {
                chunks.push(chunk);
            }

            expect(streamSpy).toHaveBeenCalled();
            const fullText = chunks
                .map((c) => new TextDecoder().decode(c))
                .join("");
            expect(fullText).toBe(content);
        });

        test("Should yield at least one chunk even for small files", async () => {
            const file = createTestFile("small.txt", "text/plain", "x");
            const httpFile = new HttpFile(file);

            let chunkCount = 0;
            for await (const _chunk of httpFile) {
                chunkCount++;
            }
            expect(chunkCount).toBeGreaterThanOrEqual(1);
        });
    });
});

import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageInferFileTypeOnWrite } from "@/file-storage/implementations/plugins/with-file-storage-infer-file-type-on-write/with-file-storage-infer-file-type-on-write.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
} from "@/file-storage/contracts/_module.js";

function iterableOf(chunk: Uint8Array): AsyncIterable<Uint8Array> {
    return {
        [Symbol.asyncIterator]: () => {
            let yielded = false;
            return {
                next: () => {
                    if (yielded) {
                        return Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        });
                    }
                    yielded = true;
                    return Promise.resolve({ done: false, value: chunk });
                },
            };
        },
    };
}

describe("function: withFileStorageInferFileTypeOnWrite", () => {
    const context = new NoOpContext();
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const zipBytes = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00,
    ]);
    const unknownBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    describe("method: add", () => {
        test("Should infer the content type from the file content", async () => {
            const spy = vi.spyOn(adapter, "add");

            const content: WritableFileAdapterContent = {
                data: zipBytes,
                fileSizeInBytes: zipBytes.length,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            await enhanced.add("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >("myKey", { ...content, contentType: "application/zip" }, context);
        });
        test("Should keep the provided content type when the file type is unknown", async () => {
            const spy = vi.spyOn(adapter, "add");

            const content: WritableFileAdapterContent = {
                data: unknownBytes,
                fileSizeInBytes: unknownBytes.length,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            await enhanced.add("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >("myKey", content, context);
        });
    });
    describe("method: addStream", () => {
        test("Should infer the content type from the file content", async () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            const content = {
                data: iterableOf(zipBytes),
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.addStream("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy.mock.calls[0]?.[1]).toMatchObject({
                contentType: "application/zip",
            });
        });
        test("Should keep the provided content type when the file type is unknown", async () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = iterableOf(unknownBytes);
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.addStream("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy.mock.calls[0]?.[1]).toMatchObject({
                contentType: "application/octet-stream",
            });
            const forwardedData = spy.mock.calls[0]?.[1]?.data;
            const chunks: Array<Uint8Array> = [];
            if (forwardedData !== undefined) {
                for await (const chunk of forwardedData) {
                    chunks.push(chunk);
                }
            }
            expect(
                new Uint8Array(chunks.flatMap((chunk) => [...chunk])),
            ).toEqual(unknownBytes);
        });
    });
    describe("method: update", () => {
        test("Should infer the content type from the file content", async () => {
            const spy = vi.spyOn(adapter, "update");

            const content: WritableFileAdapterContent = {
                data: zipBytes,
                fileSizeInBytes: zipBytes.length,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            await enhanced.update("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >("myKey", { ...content, contentType: "application/zip" }, context);
        });
        test("Should keep the provided content type when the file type is unknown", async () => {
            const spy = vi.spyOn(adapter, "update");

            const content: WritableFileAdapterContent = {
                data: unknownBytes,
                fileSizeInBytes: unknownBytes.length,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            await enhanced.update("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >("myKey", content, context);
        });
    });
    describe("method: updateStream", () => {
        test("Should infer the content type from the file content", async () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = iterableOf(zipBytes);
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.updateStream("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy.mock.calls[0]?.[1]).toMatchObject({
                contentType: "application/zip",
            });
        });
        test("Should keep the provided content type when the file type is unknown", async () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = iterableOf(unknownBytes);
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.updateStream("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy.mock.calls[0]?.[1]).toMatchObject({
                contentType: "application/octet-stream",
            });
            const forwardedData = spy.mock.calls[0]?.[1]?.data;
            const chunks: Array<Uint8Array> = [];
            if (forwardedData !== undefined) {
                for await (const chunk of forwardedData) {
                    chunks.push(chunk);
                }
            }
            expect(
                new Uint8Array(chunks.flatMap((chunk) => [...chunk])),
            ).toEqual(unknownBytes);
        });
    });
    describe("method: put", () => {
        test("Should infer the content type from the file content", async () => {
            const spy = vi.spyOn(adapter, "put");

            const content: WritableFileAdapterContent = {
                data: zipBytes,
                fileSizeInBytes: zipBytes.length,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            await enhanced.put("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >("myKey", { ...content, contentType: "application/zip" }, context);
        });
        test("Should keep the provided content type when the file type is unknown", async () => {
            const spy = vi.spyOn(adapter, "put");

            const content: WritableFileAdapterContent = {
                data: unknownBytes,
                fileSizeInBytes: unknownBytes.length,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            await enhanced.put("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >("myKey", content, context);
        });
    });
    describe("method: putStream", () => {
        test("Should infer the content type from the file content", async () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = iterableOf(zipBytes);
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.putStream("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy.mock.calls[0]?.[1]).toMatchObject({
                contentType: "application/zip",
            });
        });
        test("Should keep the provided content type when the file type is unknown", async () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = iterableOf(unknownBytes);
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.putStream("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy.mock.calls[0]?.[1]).toMatchObject({
                contentType: "application/octet-stream",
            });
            const forwardedData = spy.mock.calls[0]?.[1]?.data;
            const chunks: Array<Uint8Array> = [];
            if (forwardedData !== undefined) {
                for await (const chunk of forwardedData) {
                    chunks.push(chunk);
                }
            }
            expect(
                new Uint8Array(chunks.flatMap((chunk) => [...chunk])),
            ).toEqual(unknownBytes);
        });
    });
});

import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageInferContentTypeOnWrite } from "@/file-storage/implementations/plugins/with-file-storage-infer-content-type-on-write/with-file-storage-infer-content-type-on-write.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
} from "@/file-storage/contracts/_module.js";

describe("function: withFileStorageInferContentTypeOnWrite", () => {
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.getSignedDownloadUrl("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
                contentDisposition: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "text/plain",
                contentDisposition: null,
            });
        });
        test("Should keep a null content type", async () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.getSignedDownloadUrl("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: null,
                contentDisposition: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: null,
                contentDisposition: null,
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.getSignedDownloadUrl(
                "folder/file.unknownExtension",
                {
                    expirationInSeconds: 3600,
                    contentType: "application/octet-stream",
                    contentDisposition: null,
                },
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >("folder/file.unknownExtension", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
                contentDisposition: null,
            });
        });
        test("Should not infer the content type when inference is disabled", async () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite({
                    inferSignedDownloadUrl: false,
                }),
            );

            await enhanced.getSignedDownloadUrl("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
                contentDisposition: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
                contentDisposition: null,
            });
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.getSignedUploadUrl("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "text/plain",
            });
        });
        test("Should keep a null content type", async () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.getSignedUploadUrl("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: null,
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.getSignedUploadUrl("folder/file.unknownExtension", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >("folder/file.unknownExtension", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
            });
        });
        test("Should not infer the content type when inference is disabled", async () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite({
                    inferSignedUploadUrl: false,
                }),
            );

            await enhanced.getSignedUploadUrl("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >("folder/file.txt", {
                expirationInSeconds: 3600,
                contentType: "application/octet-stream",
            });
        });
    });
    describe("method: add", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "add");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.add("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >("folder/file.txt", {
                ...content,
                contentType: "text/plain",
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "add");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.add("folder/file.unknownExtension", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >("folder/file.unknownExtension", content);
        });
    });
    describe("method: addStream", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.addStream("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["addStream"]>
            >("folder/file.txt", {
                ...content,
                contentType: "text/plain",
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.addStream("folder/file.unknownExtension", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["addStream"]>
            >("folder/file.unknownExtension", content);
        });
    });
    describe("method: update", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "update");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.update("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >("folder/file.txt", {
                ...content,
                contentType: "text/plain",
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "update");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.update("folder/file.unknownExtension", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >("folder/file.unknownExtension", content);
        });
    });
    describe("method: updateStream", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.updateStream("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["updateStream"]>
            >("folder/file.txt", {
                ...content,
                contentType: "text/plain",
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.updateStream(
                "folder/file.unknownExtension",
                content,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["updateStream"]>
            >("folder/file.unknownExtension", content);
        });
    });
    describe("method: put", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "put");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.put("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >("folder/file.txt", {
                ...content,
                contentType: "text/plain",
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "put");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            await enhanced.put("folder/file.unknownExtension", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >("folder/file.unknownExtension", content);
        });
    });
    describe("method: putStream", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.putStream("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["putStream"]>
            >("folder/file.txt", {
                ...content,
                contentType: "text/plain",
            });
        });
        test("Should keep the provided content type when the extension is unknown", async () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnWrite(),
            );

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            const content = {
                data: stream,
                fileSizeInBytes: null,
                contentType: "application/octet-stream",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            await enhanced.putStream("folder/file.unknownExtension", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["putStream"]>
            >("folder/file.unknownExtension", content);
        });
    });
});

import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStoragePrefix } from "@/file-storage/implementations/plugins/with-file-storage-prefix/with-file-storage-prefix.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
} from "@/file-storage/contracts/_module.js";

describe("function: withFileStoragePrefix", () => {
    const adapter = new NoOpFileStorageAdapter();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    describe("method: getPublicUrl", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getPublicUrl");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getPublicUrl("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getPublicUrl"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getSignedDownloadUrl("myKey", {
                expirationInSeconds: 3600,
                contentType: null,
                contentDisposition: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >(`${prefix}myKey`, {
                expirationInSeconds: 3600,
                contentType: null,
                contentDisposition: null,
            });
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getSignedUploadUrl("myKey", {
                expirationInSeconds: 3600,
                contentType: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >(`${prefix}myKey`, {
                expirationInSeconds: 3600,
                contentType: null,
            });
        });
    });
    describe("method: exists", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "exists");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.exists("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["exists"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: getStream", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getStream");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getStream("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getStream"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: getBytes", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getBytes");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getBytes("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getBytes"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: getMetaData", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "getMetaData");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getMetaData("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >(`${prefix}myKey`);
        });
    });
    describe("method: add", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "add");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.add("myKey", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >(`${prefix}myKey`, content);
        });
    });
    describe("method: addStream", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.addStream("myKey", {
                data: stream,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["addStream"]>
            >(`${prefix}myKey`, {
                data: stream,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });
        });
    });
    describe("method: update", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "update");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.update("myKey", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >(`${prefix}myKey`, content);
        });
    });
    describe("method: updateStream", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            const stream2: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.updateStream("myKey", {
                data: stream2,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["updateStream"]>
            >(`${prefix}myKey`, {
                data: stream2,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });
        });
    });
    describe("method: put", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "put");

            const content: WritableFileAdapterContent = {
                data: new Uint8Array(),
                fileSizeInBytes: 0,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            };
            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.put("myKey", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >(`${prefix}myKey`, content);
        });
    });
    describe("method: putStream", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            const stream3: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.putStream("myKey", {
                data: stream3,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["putStream"]>
            >(`${prefix}myKey`, {
                data: stream3,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });
        });
    });
    describe("method: copy", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "copy");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.copy("sourceKey", "destKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copy"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`);
        });
    });
    describe("method: copyAndReplace", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "copyAndReplace");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.copyAndReplace("sourceKey", "destKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copyAndReplace"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`);
        });
    });
    describe("method: move", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "move");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.move("sourceKey", "destKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["move"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`);
        });
    });
    describe("method: moveAndReplace", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "moveAndReplace");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.moveAndReplace("sourceKey", "destKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["moveAndReplace"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`);
        });
    });
    describe("method: removeMany", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.removeMany(["key1", "key2"]);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeMany"]>
            >([`${prefix}key1`, `${prefix}key2`]);
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should prefix the key", async () => {
            const spy = vi.spyOn(adapter, "removeByPrefix");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.removeByPrefix("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeByPrefix"]>
            >(`${prefix}myKey`);
        });
    });
});

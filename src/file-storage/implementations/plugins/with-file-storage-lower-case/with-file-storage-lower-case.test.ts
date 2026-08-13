import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageLowerCase } from "@/file-storage/implementations/plugins/with-file-storage-lower-case/with-file-storage-lower-case.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
} from "@/file-storage/contracts/_module.js";

describe("function: withFileStorageLowerCase", () => {
    const context = new NoOpContext();
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    describe("method: getPublicUrl", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "getPublicUrl");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.getPublicUrl("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getPublicUrl"]>
            >("mykey", context);
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.getSignedDownloadUrl(
                "myKey",
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                    contentDisposition: null,
                },
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >(
                "mykey",
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                    contentDisposition: null,
                },
                context,
            );
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.getSignedUploadUrl(
                "myKey",
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                },
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >(
                "mykey",
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                },
                context,
            );
        });
    });
    describe("method: exists", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "exists");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.exists("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["exists"]>
            >("mykey", context);
        });
    });
    describe("method: getStream", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "getStream");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.getStream("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getStream"]>
            >("mykey", context);
        });
    });
    describe("method: getBytes", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "getBytes");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.getBytes("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getBytes"]>
            >("mykey", context);
        });
    });
    describe("method: getMetaData", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "getMetaData");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.getMetaData("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("mykey", context);
        });
    });
    describe("method: add", () => {
        test("Should lowercase the key", async () => {
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
            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.add("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >("mykey", content, context);
        });
    });
    describe("method: addStream", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            const stream: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.addStream(
                "myKey",
                {
                    data: stream,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["addStream"]>
            >(
                "mykey",
                {
                    data: stream,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                context,
            );
        });
    });
    describe("method: update", () => {
        test("Should lowercase the key", async () => {
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
            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.update("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >("mykey", content, context);
        });
    });
    describe("method: updateStream", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            const stream2: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.updateStream(
                "myKey",
                {
                    data: stream2,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["updateStream"]>
            >(
                "mykey",
                {
                    data: stream2,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                context,
            );
        });
    });
    describe("method: put", () => {
        test("Should lowercase the key", async () => {
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
            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.put("myKey", content, context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >("mykey", content, context);
        });
    });
    describe("method: putStream", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            const stream3: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.putStream(
                "myKey",
                {
                    data: stream3,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["putStream"]>
            >(
                "mykey",
                {
                    data: stream3,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                context,
            );
        });
    });
    describe("method: copy", () => {
        test("Should lowercase the keys", async () => {
            const spy = vi.spyOn(adapter, "copy");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.copy("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copy"]>
            >("sourcekey", "destkey", context);
        });
    });
    describe("method: copyAndReplace", () => {
        test("Should lowercase the keys", async () => {
            const spy = vi.spyOn(adapter, "copyAndReplace");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.copyAndReplace("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copyAndReplace"]>
            >("sourcekey", "destkey", context);
        });
    });
    describe("method: move", () => {
        test("Should lowercase the keys", async () => {
            const spy = vi.spyOn(adapter, "move");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.move("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["move"]>
            >("sourcekey", "destkey", context);
        });
    });
    describe("method: moveAndReplace", () => {
        test("Should lowercase the keys", async () => {
            const spy = vi.spyOn(adapter, "moveAndReplace");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.moveAndReplace("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["moveAndReplace"]>
            >("sourcekey", "destkey", context);
        });
    });
    describe("method: removeMany", () => {
        test("Should lowercase the keys", async () => {
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.removeMany(["Key1", "Key2"], context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeMany"]>
            >(["key1", "key2"], context);
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should lowercase the key", async () => {
            const spy = vi.spyOn(adapter, "removeByPrefix");

            const enhanced = withPlugin(adapter, withFileStorageLowerCase());

            await enhanced.removeByPrefix("myKey", context);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeByPrefix"]>
            >("mykey", context);
        });
    });
});

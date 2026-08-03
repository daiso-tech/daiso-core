import { afterEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import {
    type ISignedFileStorageAdapter,
    type WritableFileAdapterContent,
} from "@/file-storage/contracts/_module.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStoragePrefix } from "@/file-storage/implementations/plugins/with-file-storage-prefix/with-file-storage-prefix.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withFileStoragePrefix", () => {
    const noOpContext = new NoOpContext();
    const prefix = "test-prefix:";
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));

    afterEach(() => {
        vi.clearAllMocks();
    });
    describe("method: getPublicUrl", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getPublicUrl");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getPublicUrl("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getPublicUrl"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getSignedDownloadUrl(
                "myKey",
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                    contentDisposition: null,
                },
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >(
                `${prefix}myKey`,
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                    contentDisposition: null,
                },
                noOpContext,
            );
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getSignedUploadUrl(
                "myKey",
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                },
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >(
                `${prefix}myKey`,
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                },
                noOpContext,
            );
        });
    });
    describe("method: exists", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "exists");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.exists("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["exists"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
    describe("method: getStream", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getStream");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getStream("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getStream"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
    describe("method: getBytes", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getBytes");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getBytes("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getBytes"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
    describe("method: getMetaData", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getMetaData");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getMetaData("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
    describe("method: add", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
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

            await enhanced.add("myKey", content, noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >(`${prefix}myKey`, content, noOpContext);
        });
    });
    describe("method: addStream", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
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
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["addStream"]>
            >(
                `${prefix}myKey`,
                {
                    data: stream,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                noOpContext,
            );
        });
    });
    describe("method: update", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
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

            await enhanced.update("myKey", content, noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >(`${prefix}myKey`, content, noOpContext);
        });
    });
    describe("method: updateStream", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
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
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["updateStream"]>
            >(
                `${prefix}myKey`,
                {
                    data: stream2,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                noOpContext,
            );
        });
    });
    describe("method: put", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
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

            await enhanced.put("myKey", content, noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >(`${prefix}myKey`, content, noOpContext);
        });
    });
    describe("method: putStream", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
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
                noOpContext,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["putStream"]>
            >(
                `${prefix}myKey`,
                {
                    data: stream3,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                },
                noOpContext,
            );
        });
    });
    describe("method: copy", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "copy");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.copy("sourceKey", "destKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copy"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, noOpContext);
        });
    });
    describe("method: copyAndReplace", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "copyAndReplace");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.copyAndReplace("sourceKey", "destKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copyAndReplace"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, noOpContext);
        });
    });
    describe("method: move", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "move");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.move("sourceKey", "destKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["move"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, noOpContext);
        });
    });
    describe("method: moveAndReplace", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "moveAndReplace");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.moveAndReplace("sourceKey", "destKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["moveAndReplace"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, noOpContext);
        });
    });
    describe("method: removeMany", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.removeMany(["key1", "key2"], noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeMany"]>
            >([`${prefix}key1`, `${prefix}key2`], noOpContext);
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "removeByPrefix");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.removeByPrefix("myKey", noOpContext);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeByPrefix"]>
            >(`${prefix}myKey`, noOpContext);
        });
    });
});

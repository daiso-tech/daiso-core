import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
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
    const context = new Context(new Map());
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

            await enhanced.getPublicUrl("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["getPublicUrl"]>
            >(`${prefix}myKey`, context);
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
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["getSignedDownloadUrl"]>
            >(
                `${prefix}myKey`,
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
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["getSignedUploadUrl"]>
            >(
                `${prefix}myKey`,
                {
                    expirationInSeconds: 3600,
                    contentType: null,
                },
                context,
            );
        });
    });
    describe("method: exists", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "exists");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.exists("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["exists"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: getStream", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getStream");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getStream("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["getStream"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: getBytes", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getBytes");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getBytes("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["getBytes"]>
            >(`${prefix}myKey`, context);
        });
    });
    describe("method: getMetaData", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "getMetaData");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.getMetaData("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >(`${prefix}myKey`, context);
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

            await enhanced.add("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >(`${prefix}myKey`, content, context);
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
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
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
                context,
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

            await enhanced.update("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >(`${prefix}myKey`, content, context);
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
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
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
                context,
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

            await enhanced.put("myKey", content, context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >(`${prefix}myKey`, content, context);
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
                context,
            );

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
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
                context,
            );
        });
    });
    describe("method: copy", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "copy");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.copy("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["copy"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, context);
        });
    });
    describe("method: copyAndReplace", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "copyAndReplace");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.copyAndReplace("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["copyAndReplace"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, context);
        });
    });
    describe("method: move", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "move");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.move("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["move"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, context);
        });
    });
    describe("method: moveAndReplace", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "moveAndReplace");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.moveAndReplace("sourceKey", "destKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["moveAndReplace"]>
            >(`${prefix}sourceKey`, `${prefix}destKey`, context);
        });
    });
    describe("method: removeMany", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.removeMany(["key1", "key2"], context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["removeMany"]>
            >([`${prefix}key1`, `${prefix}key2`], context);
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should prefix the key", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const spy = vi.spyOn(adapter, "removeByPrefix");

            const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

            await enhanced.removeByPrefix("myKey", context);

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenCalledWith<
                Parameters<ISignedFileStorageAdapter["removeByPrefix"]>
            >(`${prefix}myKey`, context);
        });
    });
});

import { afterEach, describe, expect, test, vi } from "vitest";

import { Context } from "@/execution-context/implementations/derivables/execution-context/context.js";
import { type WritableFileAdapterContent } from "@/file-storage/contracts/_module.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStoragePrefix } from "@/file-storage/implementations/plugins/with-file-storage-prefix/file-storage-prefix.js";
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

    test("Should prefix keys for getPublicUrl", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "getPublicUrl");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.getPublicUrl(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for getSignedDownloadUrl", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.getSignedDownloadUrl(context, "myKey", {
            expirationInSeconds: 3600,
            contentType: null,
            contentDisposition: null,
        });

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, {
            expirationInSeconds: 3600,
            contentType: null,
            contentDisposition: null,
        });
    });

    test("Should prefix keys for getSignedUploadUrl", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "getSignedUploadUrl");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.getSignedUploadUrl(context, "myKey", {
            expirationInSeconds: 3600,
            contentType: null,
        });

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, {
            expirationInSeconds: 3600,
            contentType: null,
        });
    });

    test("Should prefix keys for exists", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "exists");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.exists(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for getStream", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "getStream");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.getStream(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for getBytes", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "getBytes");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.getBytes(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for getMetaData", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "getMetaData");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.getMetaData(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });

    test("Should prefix keys for add", async () => {
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

        await enhanced.add(context, "myKey", content);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, content);
    });

    test("Should prefix keys for addStream", async () => {
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
        await enhanced.addStream(context, "myKey", {
            data: stream,
            fileSizeInBytes: null,
            contentType: "text/plain",
            contentLanguage: null,
            contentEncoding: null,
            contentDisposition: null,
            cacheControl: null,
        });

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, {
            data: stream,
            fileSizeInBytes: null,
            contentType: "text/plain",
            contentLanguage: null,
            contentEncoding: null,
            contentDisposition: null,
            cacheControl: null,
        });
    });

    test("Should prefix keys for update", async () => {
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

        await enhanced.update(context, "myKey", content);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, content);
    });

    test("Should prefix keys for updateStream", async () => {
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
        await enhanced.updateStream(context, "myKey", {
            data: stream2,
            fileSizeInBytes: null,
            contentType: "text/plain",
            contentLanguage: null,
            contentEncoding: null,
            contentDisposition: null,
            cacheControl: null,
        });

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, {
            data: stream2,
            fileSizeInBytes: null,
            contentType: "text/plain",
            contentLanguage: null,
            contentEncoding: null,
            contentDisposition: null,
            cacheControl: null,
        });
    });

    test("Should prefix keys for put", async () => {
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

        await enhanced.put(context, "myKey", content);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, content);
    });

    test("Should prefix keys for putStream", async () => {
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
        await enhanced.putStream(context, "myKey", {
            data: stream3,
            fileSizeInBytes: null,
            contentType: "text/plain",
            contentLanguage: null,
            contentEncoding: null,
            contentDisposition: null,
            cacheControl: null,
        });

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`, {
            data: stream3,
            fileSizeInBytes: null,
            contentType: "text/plain",
            contentLanguage: null,
            contentEncoding: null,
            contentDisposition: null,
            cacheControl: null,
        });
    });

    test("Should prefix keys for copy", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "copy");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.copy(context, "sourceKey", "destKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}sourceKey`,
            "destKey",
        );
    });

    test("Should prefix keys for copyAndReplace", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "copyAndReplace");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.copyAndReplace(context, "sourceKey", "destKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}sourceKey`,
            "destKey",
        );
    });

    test("Should prefix keys for move", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "move");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.move(context, "sourceKey", "destKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}sourceKey`,
            "destKey",
        );
    });

    test("Should prefix keys for moveAndReplace", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "moveAndReplace");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.moveAndReplace(context, "sourceKey", "destKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(
            context,
            `${prefix}sourceKey`,
            "destKey",
        );
    });

    test("Should prefix keys for removeMany", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "removeMany");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.removeMany(context, ["key1", "key2"]);

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, [
            `${prefix}key1`,
            `${prefix}key2`,
        ]);
    });

    test("Should prefix keys for removeByPrefix", async () => {
        const adapter = new NoOpFileStorageAdapter();
        const spy = vi.spyOn(adapter, "removeByPrefix");

        const enhanced = withPlugin(adapter, withFileStoragePrefix(prefix));

        await enhanced.removeByPrefix(context, "myKey");

        expect(spy).toHaveBeenCalledOnce();
        expect(spy).toHaveBeenCalledWith(context, `${prefix}myKey`);
    });
});

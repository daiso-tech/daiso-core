import { beforeEach, describe, expect, test, vi } from "vitest";

import { InvalidKeyFileError } from "@/file-storage/contracts/_module.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageKeyValidator } from "@/file-storage/implementations/plugins/with-file-storage-key-validator/with-file-storage-key-validator.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
} from "@/file-storage/contracts/_module.js";
import type { InvocableFn } from "@/utilities/_module.js";

describe("function: withFileStorageKeyValidator", () => {
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const succeedingKeyValidator = vi
        .fn<InvocableFn<[key: string], string | null>>()
        .mockReturnValue(null);
    const failingKeyValidator = vi
        .fn<InvocableFn<[key: string], string | null>>()
        .mockReturnValue("The key is invalid");

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    describe("method: getPublicUrl", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "getPublicUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.getPublicUrl("folder/file.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getPublicUrl"]>
            >("folder/file.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "getPublicUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.getPublicUrl("../secret.txt")).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
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
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "getSignedDownloadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() =>
                enhanced.getSignedDownloadUrl("../secret.txt", {
                    expirationInSeconds: 3600,
                    contentType: null,
                    contentDisposition: null,
                }),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
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
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "getSignedUploadUrl");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() =>
                enhanced.getSignedUploadUrl("../secret.txt", {
                    expirationInSeconds: 3600,
                    contentType: null,
                }),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: exists", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "exists");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.exists("folder/file.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["exists"]>
            >("folder/file.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "exists");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.exists("../secret.txt")).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: getStream", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "getStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.getStream("folder/file.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getStream"]>
            >("folder/file.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "getStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.getStream("../secret.txt")).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: getBytes", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "getBytes");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.getBytes("folder/file.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getBytes"]>
            >("folder/file.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "getBytes");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.getBytes("../secret.txt")).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: getMetaData", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "getMetaData");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.getMetaData("folder/file.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("folder/file.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "getMetaData");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.getMetaData("../secret.txt")).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: add", () => {
        test("Should accept a valid key", async () => {
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
            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.add("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["add"]>
            >("folder/file.txt", content);
        });
        test("Should throw on an invalid key", () => {
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
            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.add("../secret.txt", content)).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: addStream", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
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
            await enhanced.addStream("folder/file.txt", {
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
            >("folder/file.txt", {
                data: stream,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "addStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
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
            expect(() =>
                enhanced.addStream("../secret.txt", {
                    data: stream,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                }),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: update", () => {
        test("Should accept a valid key", async () => {
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
            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.update("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["update"]>
            >("folder/file.txt", content);
        });
        test("Should throw on an invalid key", () => {
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
            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.update("../secret.txt", content)).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: updateStream", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            const stream2: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.updateStream("folder/file.txt", {
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
            >("folder/file.txt", {
                data: stream2,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "updateStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            const stream2: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            expect(() =>
                enhanced.updateStream("../secret.txt", {
                    data: stream2,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                }),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: put", () => {
        test("Should accept a valid key", async () => {
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
            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.put("folder/file.txt", content);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["put"]>
            >("folder/file.txt", content);
        });
        test("Should throw on an invalid key", () => {
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
            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.put("../secret.txt", content)).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: putStream", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            const stream3: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            await enhanced.putStream("folder/file.txt", {
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
            >("folder/file.txt", {
                data: stream3,
                fileSizeInBytes: null,
                contentType: "text/plain",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "putStream");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            const stream3: AsyncIterable<Uint8Array> = {
                [Symbol.asyncIterator]: () => ({
                    next: () =>
                        Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        }),
                }),
            };
            expect(() =>
                enhanced.putStream("../secret.txt", {
                    data: stream3,
                    fileSizeInBytes: null,
                    contentType: "text/plain",
                    contentLanguage: null,
                    contentEncoding: null,
                    contentDisposition: null,
                    cacheControl: null,
                }),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: copy", () => {
        test("Should accept valid keys", async () => {
            const spy = vi.spyOn(adapter, "copy");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.copy("folder/src.txt", "folder/dest.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copy"]>
            >("folder/src.txt", "folder/dest.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "copy");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() =>
                enhanced.copy("../src.txt", "folder/dest.txt"),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: copyAndReplace", () => {
        test("Should accept valid keys", async () => {
            const spy = vi.spyOn(adapter, "copyAndReplace");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.copyAndReplace("folder/src.txt", "folder/dest.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["copyAndReplace"]>
            >("folder/src.txt", "folder/dest.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "copyAndReplace");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() =>
                enhanced.copyAndReplace("../src.txt", "folder/dest.txt"),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: move", () => {
        test("Should accept valid keys", async () => {
            const spy = vi.spyOn(adapter, "move");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.move("folder/src.txt", "folder/dest.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["move"]>
            >("folder/src.txt", "folder/dest.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "move");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() =>
                enhanced.move("../src.txt", "folder/dest.txt"),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: moveAndReplace", () => {
        test("Should accept valid keys", async () => {
            const spy = vi.spyOn(adapter, "moveAndReplace");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.moveAndReplace("folder/src.txt", "folder/dest.txt");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["moveAndReplace"]>
            >("folder/src.txt", "folder/dest.txt");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "moveAndReplace");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() =>
                enhanced.moveAndReplace("../src.txt", "folder/dest.txt"),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: removeMany", () => {
        test("Should accept valid keys", async () => {
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.removeMany(["folder/a.txt", "folder/b.txt"]);

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeMany"]>
            >(["folder/a.txt", "folder/b.txt"]);
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "removeMany");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() =>
                enhanced.removeMany(["folder/a.txt", "../b.txt"]),
            ).toThrow(InvalidKeyFileError);
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should accept a valid key", async () => {
            const spy = vi.spyOn(adapter, "removeByPrefix");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(succeedingKeyValidator),
            );

            await enhanced.removeByPrefix("folder/");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["removeByPrefix"]>
            >("folder/");
        });
        test("Should throw on an invalid key", () => {
            const spy = vi.spyOn(adapter, "removeByPrefix");

            const enhanced = withPlugin(
                adapter,
                withFileStorageKeyValidator(failingKeyValidator),
            );

            expect(() => enhanced.removeByPrefix("../")).toThrow(
                InvalidKeyFileError,
            );
            expect(spy).not.toHaveBeenCalled();
        });
    });
});

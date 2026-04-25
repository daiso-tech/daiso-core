import { beforeEach, describe, expect, test, vi } from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    FILE_WRITE_ENUM,
    type FileAdapterMetadata,
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
    type FileAdapterStream,
    type FileWriteEnum,
    type IFileStorageAdapter,
    type IFileUrlAdapter,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";
import { SignedFileStorageAdapter } from "@/file-storage/implementations/derivables/file-storage/signed-file-storage-adapter.js";

describe("class: SignedFileStorageAdapter", () => {
    let signedFileStorageAdapter: SignedFileStorageAdapter;
    const fileStorageAdapter: IFileStorageAdapter = {
        exists(_context: IReadableContext, _key: string): Promise<boolean> {
            return Promise.resolve(false);
        },
        getStream(
            _context: IReadableContext,
            _key: string,
        ): Promise<FileAdapterStream | null> {
            return Promise.resolve(null);
        },
        getBytes(
            _context: IReadableContext,
            _key: string,
        ): Promise<Uint8Array | null> {
            return Promise.resolve(null);
        },
        getMetaData(
            _context: IReadableContext,
            _key: string,
        ): Promise<FileAdapterMetadata | null> {
            return Promise.resolve(null);
        },
        add(
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        addStream(
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        update(
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        updateStream(
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        put(
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        putStream(
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        copy(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<FileWriteEnum> {
            return Promise.resolve(FILE_WRITE_ENUM.NOT_FOUND);
        },
        copyAndReplace(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        move(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<FileWriteEnum> {
            return Promise.resolve(FILE_WRITE_ENUM.NOT_FOUND);
        },
        moveAndReplace(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        removeMany(
            _context: IReadableContext,
            _keys: Array<string>,
        ): Promise<boolean> {
            return Promise.resolve(false);
        },
        removeByPrefix(
            _context: IReadableContext,
            _prefix: string,
        ): Promise<void> {
            return Promise.resolve();
        },
    };
    const fileUrlAdapter: IFileUrlAdapter = {
        getPublicUrl(
            _context: IReadableContext,
            _key: string,
        ): Promise<string | null> {
            return Promise.resolve(null);
        },
        getSignedDownloadUrl(
            _context: IReadableContext,
            _key: string,
            _settings: FileAdapterSignedDownloadUrlSettings,
        ): Promise<string | null> {
            return Promise.resolve(null);
        },
        getSignedUploadUrl(
            _context: IReadableContext,
            _key: string,
            _settings: FileAdapterSignedUploadUrlSettings,
        ): Promise<string> {
            return Promise.resolve("");
        },
    };
    const noOpContext = new ExecutionContext(new NoOpExecutionContextAdapter());
    beforeEach(() => {
        vi.clearAllMocks();
        signedFileStorageAdapter = new SignedFileStorageAdapter(
            fileStorageAdapter,
            fileUrlAdapter,
        );
    });

    describe("method: exists", () => {
        test("Should call IFileStorageAdapter.exists", async () => {
            const existsSpy = vi.spyOn(fileStorageAdapter, "exists");

            await signedFileStorageAdapter.exists(noOpContext, "a");

            expect(existsSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getStream", () => {
        test("Should call IFileStorageAdapter.getStream", async () => {
            const getStreamSpy = vi.spyOn(fileStorageAdapter, "getStream");

            await signedFileStorageAdapter.getStream(noOpContext, "a");

            expect(getStreamSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getBytes", () => {
        test("Should call IFileStorageAdapter.getBytes", async () => {
            const getBytesSpy = vi.spyOn(fileStorageAdapter, "getBytes");

            await signedFileStorageAdapter.getBytes(noOpContext, "a");

            expect(getBytesSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getMetaData", () => {
        test("Should call IFileStorageAdapter.getMetaData", async () => {
            const getMetaDataSpy = vi.spyOn(fileStorageAdapter, "getMetaData");

            await signedFileStorageAdapter.getMetaData(noOpContext, "a");

            expect(getMetaDataSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: add", () => {
        test("Should call IFileStorageAdapter.add", async () => {
            const addSpy = vi.spyOn(fileStorageAdapter, "add");

            await signedFileStorageAdapter.add(noOpContext, "a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                fileSizeInBytes: 0,
            });

            expect(addSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: addStream", () => {
        test("Should call IFileStorageAdapter.addStream", async () => {
            const addStreamSpy = vi.spyOn(fileStorageAdapter, "addStream");

            await signedFileStorageAdapter.addStream(noOpContext, "a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: {
                    async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                        yield Promise.resolve(
                            new Uint8Array(Buffer.from("CONTENT", "utf8")),
                        );
                    },
                },
                fileSizeInBytes: 0,
            });
            expect(addStreamSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: update", () => {
        test("Should call IFileStorageAdapter.update", async () => {
            const updateSpy = vi.spyOn(fileStorageAdapter, "update");

            await signedFileStorageAdapter.update(noOpContext, "a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                fileSizeInBytes: 0,
            });

            expect(updateSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: updateStream", () => {
        test("Should call IFileStorageAdapter.updateStream", async () => {
            const updateStreamSpy = vi.spyOn(
                fileStorageAdapter,
                "updateStream",
            );

            await signedFileStorageAdapter.updateStream(noOpContext, "a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: {
                    async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                        yield Promise.resolve(
                            new Uint8Array(Buffer.from("CONTENT", "utf8")),
                        );
                    },
                },
                fileSizeInBytes: 0,
            });

            expect(updateStreamSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: put", () => {
        test("Should call IFileStorageAdapter.put", async () => {
            const putSpy = vi.spyOn(fileStorageAdapter, "put");

            await signedFileStorageAdapter.put(noOpContext, "a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                fileSizeInBytes: 0,
            });

            expect(putSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: putStream", () => {
        test("Should call IFileStorageAdapter.putStream", async () => {
            const putStreamSpy = vi.spyOn(fileStorageAdapter, "putStream");

            await signedFileStorageAdapter.putStream(noOpContext, "a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: {
                    async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                        yield Promise.resolve(
                            new Uint8Array(Buffer.from("CONTENT", "utf8")),
                        );
                    },
                },
                fileSizeInBytes: 0,
            });

            expect(putStreamSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: copy", () => {
        test("Should call IFileStorageAdapter.copy", async () => {
            const copySpy = vi.spyOn(fileStorageAdapter, "copy");

            await signedFileStorageAdapter.copy(noOpContext, "a", "b");

            expect(copySpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: copyAndReplace", () => {
        test("Should call IFileStorageAdapter.copyAndReplace", async () => {
            const copyAndReplaceSpy = vi.spyOn(
                fileStorageAdapter,
                "copyAndReplace",
            );

            await signedFileStorageAdapter.copyAndReplace(
                noOpContext,
                "a",
                "b",
            );

            expect(copyAndReplaceSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: move", () => {
        test("Should call IFileStorageAdapter.move", async () => {
            const moveSpy = vi.spyOn(fileStorageAdapter, "move");

            await signedFileStorageAdapter.move(noOpContext, "a", "b");

            expect(moveSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: moveAndReplace", () => {
        test("Should call IFileStorageAdapter.moveAndReplace", async () => {
            const moveAndReplaceSpy = vi.spyOn(
                fileStorageAdapter,
                "moveAndReplace",
            );

            await signedFileStorageAdapter.moveAndReplace(
                noOpContext,
                "a",
                "b",
            );

            expect(moveAndReplaceSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: removeMany", () => {
        test("Should call IFileStorageAdapter.removeMany", async () => {
            const removeManySpy = vi.spyOn(fileStorageAdapter, "removeMany");

            await signedFileStorageAdapter.removeMany(noOpContext, ["a"]);

            expect(removeManySpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should call IFileStorageAdapter.removeByPrefix", async () => {
            const removeManySpy = vi.spyOn(
                fileStorageAdapter,
                "removeByPrefix",
            );

            await signedFileStorageAdapter.removeByPrefix(noOpContext, "a");

            expect(removeManySpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getPublicUrl", () => {
        test("Should call IFileUrlAdapter.getPublicUrl", async () => {
            const getPublicUrlSpy = vi.spyOn(fileUrlAdapter, "getPublicUrl");

            await signedFileStorageAdapter.getPublicUrl(noOpContext, "a");

            expect(getPublicUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should call IFileUrlAdapter.getSignedDownloadUrl", async () => {
            const getSignedDownloadUrlSpy = vi.spyOn(
                fileUrlAdapter,
                "getSignedDownloadUrl",
            );

            await signedFileStorageAdapter.getSignedDownloadUrl(
                noOpContext,
                "a",
                {
                    contentDisposition: null,
                    contentType: null,
                    expirationInSeconds: 5000,
                },
            );

            expect(getSignedDownloadUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should call IFileUrlAdapter.getSignedUploadUrl", async () => {
            const getSignedUploadUrlSpy = vi.spyOn(
                fileUrlAdapter,
                "getSignedUploadUrl",
            );

            await signedFileStorageAdapter.getSignedUploadUrl(
                noOpContext,
                "a",
                {
                    contentType: null,
                    expirationInSeconds: 5000,
                },
            );

            expect(getSignedUploadUrlSpy).toHaveBeenCalledOnce();
        });
    });
});

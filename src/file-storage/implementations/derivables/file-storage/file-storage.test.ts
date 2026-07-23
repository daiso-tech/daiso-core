import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    KeyNotFoundFileError,
    type FileAdapterMetadata,
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
    type FileAdapterStream,
    type FileWriteEnum,
    type IFile,
    type IFileStorageAdapter,
    type IFileUrlAdapter,
    type ISignedFileStorageAdapter,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";
import { FsFileStorageAdapter } from "@/file-storage/implementations/adapters/fs-file-storage-adapter/_module.js";
import { MemoryFileStorageAdapter } from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module.js";
import { FileStorage } from "@/file-storage/implementations/derivables/file-storage/file-storage.js";
import { fileStorageTestSuite } from "@/file-storage/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import { delay } from "@/utilities/_module.js";

describe("class: FileStorage", () => {
    fileStorageTestSuite({
        createFileStorage: () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const fileStorage = new FileStorage({
                serde,
                adapter: new MemoryFileStorageAdapter(),
            });
            return {
                fileStorage,
                serde,
            };
        },
        beforeEach,
        describe,
        expect,
        test,
    });

    const mockedUrlAdapter: IFileUrlAdapter = {
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
    const mockedAdapter: IFileStorageAdapter = {
        exists(_context: IReadableContext, _key: string): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        getStream(
            _context: IReadableContext,
            _key: string,
        ): Promise<FileAdapterStream | null> {
            throw new Error("Function not implemented.");
        },
        getBytes(
            _context: IReadableContext,
            _key: string,
        ): Promise<Uint8Array | null> {
            throw new Error("Function not implemented.");
        },
        getMetaData(
            _context: IReadableContext,
            _key: string,
        ): Promise<FileAdapterMetadata | null> {
            throw new Error("Function not implemented.");
        },
        add(
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        addStream(
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        update(
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        updateStream(
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        put(
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        putStream(
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        copy(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<FileWriteEnum> {
            throw new Error("Function not implemented.");
        },
        copyAndReplace(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        move(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<FileWriteEnum> {
            throw new Error("Function not implemented.");
        },
        moveAndReplace(
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        removeMany(
            _context: IReadableContext,
            _keys: Array<string>,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        removeByPrefix(
            _context: IReadableContext,
            _prefix: string,
        ): Promise<void> {
            throw new Error("Function not implemented.");
        },
    };
    const mockedSignedAdapter: ISignedFileStorageAdapter = {
        ...mockedUrlAdapter,
        ...mockedAdapter,
    };

    const TTL = TimeSpan.fromMilliseconds(10);
    beforeEach(() => {
        vi.resetAllMocks();
    });
    describe("method: getPublicUrl", () => {
        test("Should return null when method is not defined in adapter or derivable", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
            });

            const result = await fileStorage.create("a").getPublicUrl();

            expect(result).toBeNull();
        });
        test("Should call the adapter method when the adapter method is defined", async () => {
            const getPublicUrlSpy = vi.spyOn(
                mockedSignedAdapter,
                "getPublicUrl",
            );
            const fileStorage = new FileStorage({
                adapter: mockedSignedAdapter,
                urlAdapter: mockedUrlAdapter,
            });

            await fileStorage.create("a").getPublicUrl();
            await delay(TTL);

            expect(getPublicUrlSpy).toHaveBeenCalledOnce();
        });
        test("Should call the derivable method when the adapter method is not defined", async () => {
            const getPublicUrlSpy = vi.spyOn(mockedUrlAdapter, "getPublicUrl");
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: mockedUrlAdapter,
            });

            await fileStorage.create("a").getPublicUrl();
            await delay(TTL);

            expect(getPublicUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getPublicUrlOrFail", () => {
        test("Should throw KeyNotFoundFileError when method is not defined in adapter or derivable", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
            });

            const result = fileStorage.create("a").getPublicUrlOrFail();

            await expect(result).rejects.toBeInstanceOf(KeyNotFoundFileError);
        });
        test("Should call the adapter method when the adapter method is defined", async () => {
            const getPublicUrlSpy = vi.spyOn(
                mockedSignedAdapter,
                "getPublicUrl",
            );
            const fileStorage = new FileStorage({
                adapter: mockedSignedAdapter,
                urlAdapter: mockedUrlAdapter,
            });

            try {
                await fileStorage.create("a").getPublicUrlOrFail();
            } catch (error: unknown) {
                if (!(error instanceof KeyNotFoundFileError)) {
                    throw error;
                }
            }
            await delay(TTL);

            expect(getPublicUrlSpy).toHaveBeenCalledOnce();
        });
        test("Should call the derivable method when the adapter method is not defined", async () => {
            const getPublicUrlSpy = vi.spyOn(mockedUrlAdapter, "getPublicUrl");
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: mockedUrlAdapter,
            });

            try {
                await fileStorage.create("a").getPublicUrlOrFail();
            } catch (error: unknown) {
                if (!(error instanceof KeyNotFoundFileError)) {
                    throw error;
                }
            }
            await delay(TTL);

            expect(getPublicUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should return empty string when method is not defined in adapter or derivable", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
            });

            const result = await fileStorage.create("a").getSignedUploadUrl();

            expect(result).toBe("");
        });
        test("Should call the adapter method when the adapter method is defined", async () => {
            const getSignedUploadUrlSpy = vi.spyOn(
                mockedSignedAdapter,
                "getSignedUploadUrl",
            );
            const fileStorage = new FileStorage({
                adapter: mockedSignedAdapter,
                urlAdapter: mockedUrlAdapter,
            });

            await fileStorage.create("a").getSignedUploadUrl();

            expect(getSignedUploadUrlSpy).toHaveBeenCalledOnce();
        });
        test("Should call the derivable method when the adapter method is not defined", async () => {
            const getSignedUploadUrlSpy = vi.spyOn(
                mockedUrlAdapter,
                "getSignedUploadUrl",
            );
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: mockedUrlAdapter,
            });

            await fileStorage.create("a").getSignedUploadUrl();
            await delay(TTL);

            expect(getSignedUploadUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should return null when method is not defined in adapter or derivable", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
            });

            const result = await fileStorage.create("a").getSignedDownloadUrl();

            expect(result).toBeNull();
        });
        test("Should call the adapter method when the adapter method is defined", async () => {
            const getSignedDownloadUrlSpy = vi.spyOn(
                mockedSignedAdapter,
                "getSignedDownloadUrl",
            );
            const fileStorage = new FileStorage({
                adapter: mockedSignedAdapter,
                urlAdapter: mockedUrlAdapter,
            });

            await fileStorage.create("a").getSignedDownloadUrl();
            await delay(TTL);

            expect(getSignedDownloadUrlSpy).toHaveBeenCalledOnce();
        });
        test("Should call the derivable method when the adapter method is not defined", async () => {
            const getSignedDownloadUrlSpy = vi.spyOn(
                mockedUrlAdapter,
                "getSignedDownloadUrl",
            );
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: mockedUrlAdapter,
            });

            await fileStorage.create("a").getSignedDownloadUrl();
            await delay(TTL);

            expect(getSignedDownloadUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getSignedDownloadUrlOrFail", () => {
        test("Should throw KeyNotFoundFileError when method is not defined in adapter or derivable", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
            });

            const result = fileStorage.create("a").getSignedDownloadUrlOrFail();

            await expect(result).rejects.toBeInstanceOf(KeyNotFoundFileError);
        });
        test("Should call the adapter method when the adapter method is defined", async () => {
            const getSignedDownloadUrlSpy = vi.spyOn(
                mockedSignedAdapter,
                "getSignedDownloadUrl",
            );
            const fileStorage = new FileStorage({
                adapter: mockedSignedAdapter,
                urlAdapter: mockedUrlAdapter,
            });

            try {
                await fileStorage.create("a").getSignedDownloadUrlOrFail();
            } catch (error: unknown) {
                if (!(error instanceof KeyNotFoundFileError)) {
                    throw error;
                }
            }

            await delay(TTL);
            expect(getSignedDownloadUrlSpy).toHaveBeenCalledOnce();
        });
        test("Should call the derivable method when the adapter method is not defined", async () => {
            const getSignedDownloadUrlSpy = vi.spyOn(
                mockedUrlAdapter,
                "getSignedDownloadUrl",
            );
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: mockedUrlAdapter,
            });

            try {
                await fileStorage.create("a").getSignedDownloadUrlOrFail();
            } catch (error: unknown) {
                if (!(error instanceof KeyNotFoundFileError)) {
                    throw error;
                }
            }
            await delay(TTL);

            expect(getSignedDownloadUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("Serde tests:", () => {
        test("Should differentiate between different adapters", async () => {
            let adapter2: FsFileStorageAdapter | null = null;

            try {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const key = "a";

                const adapter1 = new MemoryFileStorageAdapter();
                const fileStorage1 = new FileStorage({
                    adapter: adapter1,
                    serde,
                });
                const file1 = fileStorage1.create(key);
                const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
                await file1.add({ data: data1 });

                adapter2 = new FsFileStorageAdapter({
                    location: await mkdtemp(
                        join(tmpdir(), "fs-file-storage-adapter-tests-"),
                    ),
                });
                await adapter2.init();
                const fileStorage2 = new FileStorage({
                    adapter: adapter2,
                    serde,
                });

                const file2 = fileStorage2.create(key);
                const deserializeLock2 = serde.deserialize<IFile>(
                    serde.serialize(file2),
                );
                const data2 = new Uint8Array(Buffer.from("CONTENT_2"));
                const result = await deserializeLock2.add({ data: data2 });

                expect(result).toBe(true);
            } finally {
                if (adapter2 !== null) {
                    await adapter2.deInit();
                }
            }
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";

            const lockProvider1 = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = lockProvider1.create(key);
            const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
            await lock1.add({ data: data1 });

            const lockProvider2 = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                serdeTransformerName: "adapter2",
                serde,
            });

            const lock2 = lockProvider2.create(key);
            const deserializeLock2 = serde.deserialize<IFile>(
                serde.serialize(lock2),
            );
            const data2 = new Uint8Array(Buffer.from("CONTENT_2"));
            const result = await deserializeLock2.add({ data: data2 });

            expect(result).toBe(true);
        });
    });
});

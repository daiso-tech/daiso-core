import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import {
    FILE_EVENTS,
    KeyNotFoundFileError,
    type FileAdapterMetadata,
    type FileAdapterSignedDownloadUrlSettings,
    type FileAdapterSignedUploadUrlSettings,
    type FileAdapterStream,
    type FileWriteEnum,
    type FoundFileEvent,
    type IFile,
    type IFileStorageAdapter,
    type IFileUrlAdapter,
    type ISignedFileStorageAdapter,
    type NotFoundFileEvent,
    type WritableFileAdapterContent,
    type WritableFileAdapterStream,
} from "@/file-storage/contracts/_module.js";
import { FsFileStorageAdapter } from "@/file-storage/implementations/adapters/fs-file-storage-adapter/_module.js";
import { MemoryFileStorageAdapter } from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module.js";
import { FileStorage } from "@/file-storage/implementations/derivables/file-storage/file-storage.js";
import { fileStorageTestSuite } from "@/file-storage/implementations/test-utilities/_module.js";
import { Namespace } from "@/namespace/implementations/_module.js";
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
                eventBus: new EventBus({
                    namespace: new Namespace("event-bus"),
                    adapter: new MemoryEventBusAdapter(),
                }),
                adapter: new MemoryFileStorageAdapter(),
                namespace: new Namespace("file-storag"),
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
        getPublicUrl: function (
            _context: IReadableContext,
            _key: string,
        ): Promise<string | null> {
            return Promise.resolve(null);
        },
        getSignedDownloadUrl: function (
            _context: IReadableContext,
            _key: string,
            _settings: FileAdapterSignedDownloadUrlSettings,
        ): Promise<string | null> {
            return Promise.resolve(null);
        },
        getSignedUploadUrl: function (
            _context: IReadableContext,
            _key: string,
            _settings: FileAdapterSignedUploadUrlSettings,
        ): Promise<string> {
            return Promise.resolve("");
        },
    };
    const mockedAdapter: IFileStorageAdapter = {
        exists: function (
            _context: IReadableContext,
            _key: string,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        getStream: function (
            _context: IReadableContext,
            _key: string,
        ): Promise<FileAdapterStream | null> {
            throw new Error("Function not implemented.");
        },
        getBytes: function (
            _context: IReadableContext,
            _key: string,
        ): Promise<Uint8Array | null> {
            throw new Error("Function not implemented.");
        },
        getMetaData: function (
            _context: IReadableContext,
            _key: string,
        ): Promise<FileAdapterMetadata | null> {
            throw new Error("Function not implemented.");
        },
        add: function (
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        addStream: function (
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        update: function (
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        updateStream: function (
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        put: function (
            _context: IReadableContext,
            _key: string,
            _content: WritableFileAdapterContent,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        putStream: function (
            _context: IReadableContext,
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        copy: function (
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<FileWriteEnum> {
            throw new Error("Function not implemented.");
        },
        copyAndReplace: function (
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        move: function (
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<FileWriteEnum> {
            throw new Error("Function not implemented.");
        },
        moveAndReplace: function (
            _context: IReadableContext,
            _source: string,
            _destination: string,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        removeMany: function (
            _context: IReadableContext,
            _keys: Array<string>,
        ): Promise<boolean> {
            throw new Error("Function not implemented.");
        },
        removeByPrefix: function (
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
        test("Should dispatch NotFoundFileEvent when key doesnt exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getPublicUrl(_key) {
                        return Promise.resolve(null);
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: NotFoundFileEvent) => {});
            await fileStorage.events.addListener(
                FILE_EVENTS.NOT_FOUND,
                listener,
            );

            await fileStorage.create("a").getPublicUrl();
            await delay(TTL);

            expect(listener).toHaveBeenCalledOnce();
        });
        test("Should dispatch FoundFileEvent when key exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getPublicUrl(_key) {
                        return Promise.resolve("FAKE_URL");
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: FoundFileEvent) => {});
            await fileStorage.events.addListener(FILE_EVENTS.FOUND, listener);

            await fileStorage.create("a").getPublicUrl();
            await delay(TTL);

            expect(listener).toHaveBeenCalledOnce();
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
            } catch {
                /* EMPTY */
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
            } catch {
                /* EMPTY */
            }
            await delay(TTL);

            expect(getPublicUrlSpy).toHaveBeenCalledOnce();
        });
        test("Should dispatch NotFoundFileEvent when key doesnt exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getPublicUrl(_key) {
                        return Promise.resolve(null);
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: NotFoundFileEvent) => {});
            await fileStorage.events.addListener(
                FILE_EVENTS.NOT_FOUND,
                listener,
            );

            try {
                await fileStorage.create("a").getPublicUrlOrFail();
            } catch {
                /* EMPTY */
            }
            await delay(TTL);

            expect(listener).toHaveBeenCalledOnce();
        });
        test("Should dispatch FoundFileEvent when key exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getPublicUrl(_key) {
                        return Promise.resolve("FAKE_URL");
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: FoundFileEvent) => {});
            await fileStorage.events.addListener(FILE_EVENTS.FOUND, listener);

            await fileStorage.create("a").getPublicUrlOrFail();

            expect(listener).toHaveBeenCalledOnce();
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
        test("Should dispatch NotFoundFileEvent when key doesnt exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getSignedDownloadUrl(_key) {
                        return Promise.resolve(null);
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: NotFoundFileEvent) => {});
            await fileStorage.events.addListener(
                FILE_EVENTS.NOT_FOUND,
                listener,
            );

            await fileStorage.create("a").getSignedDownloadUrl();
            await delay(TTL);

            expect(listener).toHaveBeenCalledOnce();
        });
        test("Should dispatch FoundFileEvent when key exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getSignedDownloadUrl(_key) {
                        return Promise.resolve("FAKE_URL");
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: FoundFileEvent) => {});
            await fileStorage.events.addListener(FILE_EVENTS.FOUND, listener);

            await fileStorage.create("a").getSignedDownloadUrl();
            await delay(TTL);

            expect(listener).toHaveBeenCalledOnce();
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
            } catch {
                /* EMPTY */
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
            } catch {
                /* EMPTY */
            }
            await delay(TTL);

            expect(getSignedDownloadUrlSpy).toHaveBeenCalledOnce();
        });
        test("Should dispatch NotFoundFileEvent when key doesnt exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getSignedDownloadUrl(_key) {
                        return Promise.resolve(null);
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: NotFoundFileEvent) => {});
            await fileStorage.events.addListener(
                FILE_EVENTS.NOT_FOUND,
                listener,
            );

            try {
                await fileStorage.create("a").getSignedDownloadUrlOrFail();
            } catch {
                /* EMPTY */
            }
            await delay(TTL);

            expect(listener).toHaveBeenCalledOnce();
        });
        test("Should dispatch FoundFileEvent when key exists", async () => {
            const fileStorage = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {
                    ...mockedUrlAdapter,
                    getSignedDownloadUrl(_key) {
                        return Promise.resolve("FAKE_URL");
                    },
                },
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                }),
            });

            const listener = vi.fn((_event: FoundFileEvent) => {});
            await fileStorage.events.addListener(FILE_EVENTS.FOUND, listener);

            await fileStorage.create("a").getSignedDownloadUrlOrFail();
            await delay(TTL);

            expect(listener).toHaveBeenCalledOnce();
        });
    });
    describe("Serde tests:", () => {
        test("Should differentiate between different namespaces", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";

            const fileStorage1 = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                namespace: new Namespace("@file-storage-1"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/file-storage-1"),
                }),
                serde,
            });
            const file1 = fileStorage1.create(key);
            const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
            await file1.add({ data: data1 });

            const fileProvider2 = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                namespace: new Namespace("@file-storage-2"),
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: new Namespace("@event-bus/file-storage-2"),
                }),
                serde,
            });

            const file2 = fileProvider2.create(key);
            const deserializedLock2 = serde.deserialize<IFile>(
                serde.serialize(file2),
            );
            const data2 = new Uint8Array(Buffer.from("CONTENT_2"));
            const result = await deserializedLock2.add({ data: data2 });
            expect(result).toBe(true);
        });
        test("Should differentiate between different adapters that have same namespace", async () => {
            let adapter2: FsFileStorageAdapter | null = null;

            try {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const fileStorageNamespace = new Namespace("@file-storage");
                const eventNamespace = new Namespace("@event-bus/file-storage");
                const key = "a";

                const adapter1 = new MemoryFileStorageAdapter();
                const fileStorage1 = new FileStorage({
                    adapter: adapter1,
                    namespace: fileStorageNamespace,
                    eventBus: new EventBus({
                        adapter: new MemoryEventBusAdapter(),
                        namespace: eventNamespace,
                    }),
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
                    namespace: fileStorageNamespace,
                    eventBus: new EventBus({
                        adapter: new MemoryEventBusAdapter(),
                        namespace: eventNamespace,
                    }),
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
            const fileStorageNamespace = new Namespace("@file-storage");
            const eventNamespace = new Namespace("@event-bus/file-storage");
            const key = "a";

            const lockProvider1 = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                namespace: fileStorageNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = lockProvider1.create(key);
            const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
            await lock1.add({ data: data1 });

            const lockProvider2 = new FileStorage({
                adapter: new MemoryFileStorageAdapter(),
                namespace: fileStorageNamespace,
                eventBus: new EventBus({
                    adapter: new MemoryEventBusAdapter(),
                    namespace: eventNamespace,
                }),
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
    describe("Locking:", () => {
        test.todo("Write tests");
    });
});

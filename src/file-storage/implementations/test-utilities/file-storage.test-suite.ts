/**
 * @module FileStorage
 */

import {
    vi,
    type beforeEach,
    type ExpectStatic,
    type SuiteAPI,
    type TestAPI,
} from "vitest";

import { type EventWithType } from "@/event-bus/contracts/_module.js";
import { FileSize } from "@/file-size/implementations/_module.js";
import {
    FILE_EVENTS,
    KeyExistsFileError,
    KeyNotFoundFileError,
    type AddedFileEvent,
    type ClearedFileEvent,
    type CopiedFileEvent,
    type DestinationExistsFileEvent,
    type FileContent,
    type FileMetadata,
    type FoundFileEvent,
    type IFile,
    type IFileStorage,
    type IReadableFile,
    type KeyExistsFileEvent,
    type MovedFileEvent,
    type NotFoundFileEvent,
    type RemovedFileEvent,
    type UpdatedFileEvent,
} from "@/file-storage/contracts/_module.js";
import { type IKey } from "@/namespace/contracts/_module.js";
import { type ISerde } from "@/serde/contracts/_module.js";
import {
    isBytesArrayEqualityTester,
    resolveStream,
} from "@/test-utilities/_module.js";
import { type ITimeSpan } from "@/time-span/contracts/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export type FileStorageTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createFileStorage: () => Promisable<{
        fileStorage: IFileStorage;
        serde: ISerde;
    }>;

    /**
     * @default false
     */
    excludeEventTests?: boolean;

    /**
     * @default false
     */
    excludeSerdeTests?: boolean;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "@daiso-tech/core/time-span"
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    eventDispatchWaitTime?: ITimeSpan;
};

/**
 * The `fileStorageTestSuite` function simplifies the process of testing your custom implementation of {@link IFileStorage | `IFileStorage`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export function fileStorageTestSuite(
    settings: FileStorageTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createFileStorage,
        describe,
        beforeEach,
        excludeEventTests = false,
        excludeSerdeTests = false,
        eventDispatchWaitTime = TimeSpan.fromMilliseconds(10),
    } = settings;
    let fileStorage: IFileStorage;
    let serde: ISerde;
    beforeEach(async () => {
        const { fileStorage: fileStorage_, serde: serde_ } =
            await createFileStorage();
        fileStorage = fileStorage_;
        serde = serde_;
    });

    const waitForSettings = {
        interval: TimeSpan.fromTimeSpan(eventDispatchWaitTime).toMilliseconds(),
        timeout: TimeSpan.fromTimeSpan(eventDispatchWaitTime)
            .multiply(3)
            .toMilliseconds(),
    };

    describe("IFileStorage tests:", () => {
        expect.addEqualityTesters([isBytesArrayEqualityTester]);

        describe("Api tests:", () => {
            describe("method: getText", () => {
                test("Should return null when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .getText();

                    expect(result).toBeNull();
                });
                test("Should return text when key exists", async () => {
                    const key = "a";

                    const text = "CONTENT";
                    const data = new Uint8Array(Buffer.from(text, "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getText();

                    expect(result).toEqual(text);
                });
            });
            describe("method: getTextOrFail", () => {
                test("Should throw KeyNotFoundFileError when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = fileStorage
                        .create(noneExistingKey)
                        .getTextOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should return text when key exists", async () => {
                    const key = "a";

                    const text = "CONTENT";
                    const data = new Uint8Array(Buffer.from(text, "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getTextOrFail();

                    expect(result).toEqual(text);
                });
            });
            describe("method: getBytes", () => {
                test("Should return null when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .getBytes();

                    expect(result).toBeNull();
                });
                test("Should return Uint8Array when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getBytes();

                    expect(result).toEqual(data);
                });
            });
            describe("method: getBytesOrFail", () => {
                test("Should throw KeyNotFoundFileError when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = fileStorage
                        .create(noneExistingKey)
                        .getBytesOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should return Uint8Array when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getBytesOrFail();

                    expect(result).toEqual(data);
                });
            });
            describe("method: getBuffer", () => {
                test("Should return null when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .getBuffer();

                    expect(result).toBeNull();
                });
                test("Should return Uint8Array when key exists", async () => {
                    const key = "a";

                    const buffer = Buffer.from("CONTENT", "utf8");
                    const data = new Uint8Array(buffer);
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getBuffer();

                    expect(result).toEqual(buffer);
                });
            });
            describe("method: getBufferOrFail", () => {
                test("Should throw KeyNotFoundFileError when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = fileStorage
                        .create(noneExistingKey)
                        .getBufferOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should return Uint8Array when key exists", async () => {
                    const key = "a";

                    const buffer = Buffer.from("CONTENT", "utf8");
                    const data = new Uint8Array(buffer);
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getBufferOrFail();

                    expect(result).toEqual(data);
                });
            });
            describe("method: getArrayBuffer", () => {
                test("Should return null when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .getArrayBuffer();

                    expect(result).toBeNull();
                });
                test("Should return ArrayBuffer when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getArrayBuffer();

                    expect(result).toEqual(data);
                });
            });
            describe("method: getArrayBufferOrFail", () => {
                test("Should throw KeyNotFoundFileError when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = fileStorage
                        .create(noneExistingKey)
                        .getArrayBufferOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should return ArrayBuffer when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.getArrayBufferOrFail();

                    expect(result).toEqual(data);
                });
            });
            describe("method: getReadable", () => {
                test("Should return null when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .getReadable();

                    expect(result).toBeNull();
                });
                test("Should return Readable when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await resolveStream(
                        await file.getReadable(),
                    );

                    expect(result).toEqual(data);
                });
            });
            describe("method: getReadableOrFail", () => {
                test("Should throw KeyNotFoundFileError when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = fileStorage
                        .create(noneExistingKey)
                        .getReadableOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should return Readable when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await resolveStream(
                        await file.getReadableOrFail(),
                    );

                    expect(result).toEqual(data);
                });
            });
            describe("method: getReadableStream", () => {
                test("Should return null when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .getReadableStream();

                    expect(result).toBeNull();
                });
                test("Should return Readable when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await resolveStream(
                        await file.getReadableStream(),
                    );

                    expect(result).toEqual(data);
                });
            });
            describe("method: getReadableStreamOrFail", () => {
                test("Should throw KeyNotFoundFileError when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = fileStorage
                        .create(noneExistingKey)
                        .getReadableStreamOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should return Readable when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await resolveStream(
                        await file.getReadableStreamOrFail(),
                    );

                    expect(result).toEqual(data);
                });
            });
            describe("method: getMetadata", () => {
                test("Should return null when key does not exists", async () => {
                    const result = await fileStorage.create("a").getMetadata();

                    expect(result).toBeNull();
                });
                test("Should return initial metadata with a null updatedAt after add method", async () => {
                    const file = fileStorage.create("a.json");
                    const data = new Uint8Array(
                        Buffer.from(
                            JSON.stringify({ content: "CONTENT" }),
                            "utf8",
                        ),
                    );
                    await file.add({ data });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "application/json",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return initial metadata with a null updatedAt after put method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.put({ data });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "text/plain",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after add method followed by update method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.add({ data });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.update({
                        data: newData,
                        contentType: newContentType,
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after put method followed by update method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.put({ data });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.update({
                        data: newData,
                        contentType: newContentType,
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after put overwrites an existing file", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.put({ data });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.put({
                        data: newData,
                        contentType: newContentType,
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return initial metadata with a null updatedAt after addStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "text/plain",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return initial metadata with a null updatedAt after putStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "text/plain",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after addStream method followed by updateStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                        contentType: newContentType,
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after putStream method followed by updateStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                        contentType: newContentType,
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after putStream overwrites an existing file", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                        contentType: newContentType,
                    });
                    const result = await file.getMetadata();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
            });
            describe("method: getMetadataOrFail", () => {
                test("Should throw KeyNotFoundFileError when key does not exists", async () => {
                    const result = fileStorage.create("a").getMetadataOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should return initial metadata with a null updatedAt after add method", async () => {
                    const file = fileStorage.create("a.json");
                    const data = new Uint8Array(
                        Buffer.from(
                            JSON.stringify({ content: "CONTENT" }),
                            "utf8",
                        ),
                    );
                    await file.add({ data });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "application/json",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return initial metadata with a null updatedAt after put method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.put({ data });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "text/plain",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after add method followed by update method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.add({ data });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.update({
                        data: newData,
                        contentType: newContentType,
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after put method followed by update method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.put({ data });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.update({
                        data: newData,
                        contentType: newContentType,
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after put overwrites an existing file", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.put({ data });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.put({
                        data: newData,
                        contentType: newContentType,
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return initial metadata with a null updatedAt after addStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "text/plain",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return initial metadata with a null updatedAt after putStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: "text/plain",
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after addStream method followed by updateStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                        contentType: newContentType,
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after putStream method followed by updateStream method", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                        contentType: newContentType,
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
                test("Should return metadata with a valid updatedAt after putStream overwrites an existing file", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create("a.txt");
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newContentType = "application/octet-stream";
                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                        contentType: newContentType,
                    });
                    const result = await file.getMetadataOrFail();

                    expect(result).toEqual({
                        etag: expect.any(String) as string,
                        contentType: newContentType,
                        fileSize: FileSize.fromBytes(data.byteLength),
                        updatedAt: expect.any(Date) as Date,
                    } satisfies FileMetadata);
                });
            });
            describe("method: exists", () => {
                test("Should return false when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .exists();

                    expect(result).toBe(false);
                });
                test("Should return true when key exists", async () => {
                    const key = "a";

                    const buffer = Buffer.from("CONTENT", "utf8");
                    const data = new Uint8Array(buffer);
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.exists();

                    expect(result).toBe(true);
                });
            });
            describe("method: missing", () => {
                test("Should return true when key does not exists", async () => {
                    const noneExistingKey = "a";

                    const result = await fileStorage
                        .create(noneExistingKey)
                        .missing();

                    expect(result).toBe(true);
                });
                test("Should return false when key exists", async () => {
                    const key = "a";

                    const buffer = Buffer.from("CONTENT", "utf8");
                    const data = new Uint8Array(buffer);
                    const file = fileStorage.create(key);
                    await file.add({ data });
                    const result = await file.missing();

                    expect(result).toBe(false);
                });
            });
            describe("method: add", () => {
                test("Should return true when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = await fileStorage.create(key).add({ data });

                    expect(result).toBe(true);
                });
                test("Should return false when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    const result = await file.add({ data: newData });

                    expect(result).toBe(false);
                });
                test("Should persist data when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
                test("Should not persist data when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    await file.add({ data: newData });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
            });
            describe("method: addOrFail", () => {
                test("Should not throw error when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = fileStorage.create(key).addOrFail({ data });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw KeyExistsFileError when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addOrFail({ data });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    const result = file.addOrFail({ data: newData });

                    await expect(result).rejects.toBeInstanceOf(
                        KeyExistsFileError,
                    );
                });
                test("Should persist data when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addOrFail({ data });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
                test("Should not persist data when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addOrFail({ data });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    try {
                        await file.addOrFail({ data: newData });
                    } catch {
                        /* EMPTY */
                    }

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
            });
            describe("method: addStream", () => {
                test("Should return true when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = await fileStorage.create(key).addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    expect(result).toBe(true);
                });
                test("Should return false when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    const result = await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    expect(result).toBe(false);
                });
                test("Should persist data when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
                test("Should not persist data when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
            });
            describe("method: addStreamOrFail", () => {
                test("Should not throw error when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = fileStorage.create(key).addStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should throw KeyExistsFileError when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    const result = file.addStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        KeyExistsFileError,
                    );
                });
                test("Should persist data when key does not exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
                test("Should not persist data when key exists", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.addStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const newData = new Uint8Array(
                        Buffer.from("NEW_CONTENT", "utf8"),
                    );
                    try {
                        await file.addStreamOrFail({
                            data: {
                                async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                    yield Promise.resolve(newData);
                                },
                            },
                        });
                    } catch {
                        /* EMPTY */
                    }

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
            });
            describe("method: update", () => {
                test("Should return false when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = await fileStorage.create(key).update({
                        data,
                    });

                    expect(result).toBe(false);
                });
                test("Should not persist data when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.update({ data });

                    const result = await file.getBytes();
                    expect(result).toBeNull();
                });
                test("Should return true when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const result = await file.update({ data: newData });

                    expect(result).toBe(true);
                });
                test("Should persist data when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.update({ data: newData });

                    const result = await file.getBytes();
                    expect(result).toEqual(newData);
                });
            });
            describe("method: updateOrFail", () => {
                test("Should throw KeyNotFoundFileError when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = fileStorage.create(key).updateOrFail({
                        data,
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should not persist data when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    try {
                        await file.updateOrFail({ data });
                    } catch {
                        /* EMPTY */
                    }

                    const result = await file.getBytes();
                    expect(result).toBeNull();
                });
                test("Should not throw error when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const result = file.updateOrFail({ data: newData });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist data when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.updateOrFail({ data: newData });

                    const result = await file.getBytes();
                    expect(result).toEqual(newData);
                });
            });
            describe("method: updateStream", () => {
                test("Should return false when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = await fileStorage.create(key).updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    expect(result).toBe(false);
                });
                test("Should not persist data when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toBeNull();
                });
                test("Should return true when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const result = await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    expect(result).toBe(true);
                });
                test("Should persist data when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toEqual(newData);
                });
            });
            describe("method: updateStreamOrFail", () => {
                test("Should throw KeyNotFoundFileError when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = fileStorage.create(key).updateStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should not persist data when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    try {
                        await file.updateStreamOrFail({
                            data: {
                                async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                    yield Promise.resolve(data);
                                },
                            },
                        });
                    } catch {
                        /* EMPTY */
                    }

                    const result = await file.getBytes();
                    expect(result).toBeNull();
                });
                test("Should not throw error when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const result = file.updateStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist data when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.updateStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toEqual(newData);
                });
            });
            describe("method: put", () => {
                test("Should return false when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = await fileStorage.create(key).put({ data });

                    expect(result).toBe(false);
                });
                test("Should persist data when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.put({ data });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
                test("Should return true when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const result = await file.put({ data: newData });

                    expect(result).toBe(true);
                });
                test("Should persist data when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.put({ data: newData });

                    const result = await file.getBytes();
                    expect(result).toEqual(newData);
                });
            });
            describe("method: putStream", () => {
                test("Should return false when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const result = await fileStorage.create(key).putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    expect(result).toBe(false);
                });
                test("Should persist data when key doesnt exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(data);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toEqual(data);
                });
                test("Should return true when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const result = await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    expect(result).toBe(true);
                });
                test("Should persist data when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const newData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                                yield Promise.resolve(newData);
                            },
                        },
                    });

                    const result = await file.getBytes();
                    expect(result).toEqual(newData);
                });
            });
            describe("method: remove", () => {
                test("Should return false when key doesnt exist", async () => {
                    const key = "a";

                    const result = await fileStorage.create(key).remove();

                    expect(result).toBe(false);
                });
                test("Should return true when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const result = await file.remove();

                    expect(result).toBe(true);
                });
                test("Should persit removal when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    await file.remove();

                    const result = await file.getBytes();
                    expect(result).toBeNull();
                });
            });
            describe("method: removeOrFail", () => {
                test("Should throw KeyNotFoundFileError when key doesnt exist", async () => {
                    const key = "a";

                    const result = fileStorage.create(key).removeOrFail();

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should not throw error when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    const result = file.removeOrFail();

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persit removal when key exist", async () => {
                    const key = "a";

                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const file = fileStorage.create(key);
                    await file.add({ data });

                    await file.removeOrFail();

                    const result = await file.getBytes();
                    expect(result).toBeNull();
                });
            });
            describe("method: copy", () => {
                test("Should return false when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .copy(noneExistingDestination);

                    expect(result).toBe(false);
                });
                test("Should return false when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .copy(destination);

                    expect(result).toBe(false);
                });
                test("Should return false when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = await sourceFile.copy(destination);

                    expect(result).toBe(false);
                });
                test("Should not persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    await sourceFile.copy(destination);

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(destinationData);
                });
                test("Should return true when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = await sourceFile.copy(destination);

                    expect(result).toBe(true);
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.copy(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
            });
            describe("method: copyOrFail", () => {
                test("Should throw KeyNotFoundFileError when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = fileStorage
                        .create(noneExistingSource)
                        .copyOrFail(noneExistingDestination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should throw KeyNotFoundFileError when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = fileStorage
                        .create(noneExistingSource)
                        .copyOrFail(destination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should throw KeyExistsFileError when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = sourceFile.copyOrFail(destination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyExistsFileError,
                    );
                });
                test("Should not persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    try {
                        await sourceFile.copyOrFail(destination);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(destinationData);
                });
                test("Should not throw error when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = sourceFile.copyOrFail(destination);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.copyOrFail(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
            });
            describe("method: copyAndReplace", () => {
                test("Should return false when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .copyAndReplace(noneExistingDestination);

                    expect(result).toBe(false);
                });
                test("Should return false when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .copyAndReplace(destination);

                    expect(result).toBe(false);
                });
                test("Should return true when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = await sourceFile.copyAndReplace(destination);

                    expect(result).toBe(true);
                });
                test("Should persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    await sourceFile.copyAndReplace(destination);

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should return true when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = await sourceFile.copyAndReplace(destination);

                    expect(result).toBe(true);
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.copyAndReplace(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
            });
            describe("method: copyAndReplaceOrFail", () => {
                test("Should throw KeyNotFoundFileError when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = fileStorage
                        .create(noneExistingSource)
                        .copyAndReplaceOrFail(noneExistingDestination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should throw KeyNotFoundFileError when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = fileStorage
                        .create(noneExistingSource)
                        .copyAndReplaceOrFail(destination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should not throw error when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = sourceFile.copyAndReplaceOrFail(destination);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    await sourceFile.copyAndReplaceOrFail(destination);

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should not throw error when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = sourceFile.copyAndReplaceOrFail(destination);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.copyAndReplaceOrFail(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
            });
            describe("method: move", () => {
                test("Should return false when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .move(noneExistingDestination);

                    expect(result).toBe(false);
                });
                test("Should return false when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .move(destination);

                    expect(result).toBe(false);
                });
                test("Should return false when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = await sourceFile.move(destination);

                    expect(result).toBe(false);
                });
                test("Should not persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    await sourceFile.move(destination);

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(destinationData);
                });
                test("Should return true when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = await sourceFile.move(destination);

                    expect(result).toBe(true);
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.move(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should remove source when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const souceFile = fileStorage.create(source);
                    await souceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await souceFile.move(destination);

                    const result = await souceFile.getBytes();
                    expect(result).toBeNull();
                });
            });
            describe("method: moveOrFail", () => {
                test("Should throw KeyNotFoundFileError when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = fileStorage
                        .create(noneExistingSource)
                        .moveOrFail(noneExistingDestination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should throw KeyNotFoundFileError when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = fileStorage
                        .create(noneExistingSource)
                        .moveOrFail(destination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should throw KeyExistsFileError when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = sourceFile.moveOrFail(destination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyExistsFileError,
                    );
                });
                test("Should not persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    try {
                        await sourceFile.moveOrFail(destination);
                    } catch {
                        /* EMPTY */
                    }

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(destinationData);
                });
                test("Should not throw error when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = sourceFile.moveOrFail(destination);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.moveOrFail(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should remove source when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.moveOrFail(destination);

                    const result = await sourceFile.getBytes();
                    expect(result).toBeNull();
                });
            });
            describe("method: moveAndReplace", () => {
                test("Should return false when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .moveAndReplace(noneExistingDestination);

                    expect(result).toBe(false);
                });
                test("Should return false when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = await fileStorage
                        .create(noneExistingSource)
                        .moveAndReplace(destination);

                    expect(result).toBe(false);
                });
                test("Should return true when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = await sourceFile.moveAndReplace(destination);

                    expect(result).toBe(true);
                });
                test("Should persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    await sourceFile.moveAndReplace(destination);

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should return true when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = await sourceFile.moveAndReplace(destination);

                    expect(result).toBe(true);
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.moveAndReplace(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should remove source when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.moveAndReplace(destination);

                    const result = await sourceFile.getBytes();
                    expect(result).toBeNull();
                });
            });
            describe("method: moveAndReplaceOrFail", () => {
                test("Should throw KeyNotFoundFileError when source does not exists and destination does not exists", async () => {
                    const noneExistingSource = "a";
                    const noneExistingDestination = "c";

                    const result = fileStorage
                        .create(noneExistingSource)
                        .moveAndReplaceOrFail(noneExistingDestination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should throw KeyNotFoundFileError when source does not exists and destination exists", async () => {
                    const noneExistingSource = "a";

                    const destination = "c";
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    await fileStorage.create(destination).add({
                        data,
                    });

                    const result = fileStorage
                        .create(noneExistingSource)
                        .moveAndReplaceOrFail(destination);

                    await expect(result).rejects.toBeInstanceOf(
                        KeyNotFoundFileError,
                    );
                });
                test("Should not throw error when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    await fileStorage.create(destination).add({
                        data: destinationData,
                    });

                    const result = sourceFile.moveAndReplaceOrFail(destination);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist when source exists and destination exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const destinationData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const destinationFile = fileStorage.create(destination);
                    await destinationFile.add({
                        data: destinationData,
                    });

                    await sourceFile.moveAndReplaceOrFail(destination);

                    const result = await destinationFile.getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should not throw error when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    const result = sourceFile.moveAndReplaceOrFail(destination);

                    await expect(result).resolves.toBeUndefined();
                });
                test("Should persist data when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.moveAndReplaceOrFail(destination);

                    const result = await fileStorage
                        .create(destination)
                        .getBytes();
                    expect(result).toEqual(sourceData);
                });
                test("Should remove source when source exists and destination does not exists", async () => {
                    const source = "a";
                    const sourceData = new Uint8Array(
                        Buffer.from("CONTENT", "utf8"),
                    );
                    const sourceFile = fileStorage.create(source);
                    await sourceFile.add({
                        data: sourceData,
                    });

                    const destination = "c";
                    await sourceFile.moveAndReplaceOrFail(destination);

                    const result = await sourceFile.getBytes();
                    expect(result).toBeNull();
                });
            });
            describe("method: removeMany", () => {
                test("Should return false when all keys does not exists", async () => {
                    const result = await fileStorage.removeMany([
                        fileStorage.create("a"),
                        fileStorage.create("b"),
                        fileStorage.create("c"),
                    ]);

                    expect(result).toBe(false);
                });
                test("Should return true when one key exists", async () => {
                    const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                    const fileA = fileStorage.create("a");
                    await fileA.add({
                        data,
                    });

                    const fileB = fileStorage.create("b");
                    const fileC = fileStorage.create("c");

                    const result = await fileStorage.removeMany([
                        fileA,
                        fileB,
                        fileC,
                    ]);

                    expect(result).toBe(true);
                });
                test("Should persist removal of the keys that exists", async () => {
                    const fileA = fileStorage.create("a");
                    await fileA.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });

                    const fileB = fileStorage.create("b");
                    await fileB.add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });

                    const dataC = new Uint8Array(
                        Buffer.from("CONTENT_C", "utf8"),
                    );
                    const fileC = fileStorage.create("c");
                    await fileC.add({
                        data: dataC,
                    });

                    await fileStorage.removeMany([fileA, fileB]);

                    const result = [
                        await fileA.getBytes(),
                        await fileB.getBytes(),
                        await fileC.getBytes(),
                    ];
                    expect(result).toEqual([null, null, dataC]);
                });
            });
            describe("method: clear", () => {
                test("Should remove all the keys", async () => {
                    const fileA = fileStorage.create("a");
                    await fileA.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    const fileB = fileStorage.create("b");
                    await fileB.add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    const fileC = fileStorage.create("c");
                    await fileC.add({
                        data: new Uint8Array(Buffer.from("CONTENT_c", "utf8")),
                    });
                    const fileD = fileStorage.create("d");
                    await fileD.add({
                        data: new Uint8Array(Buffer.from("CONTENT_d", "utf8")),
                    });

                    await fileStorage.clear();

                    const results = [
                        await fileA.getBytes(),
                        await fileB.getBytes(),
                        await fileC.getBytes(),
                        await fileD.getBytes(),
                    ];
                    expect(results).toEqual([null, null, null, null]);
                });
            });
        });
        describe.skipIf(excludeEventTests)("Event tests:", () => {
            describe("method: getText", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getText();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.getText();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getTextOrFail", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getTextOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.getTextOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getBytes", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getBytes();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.getBytes();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getBytesOrFail", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getBytesOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.getBytesOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getBuffer", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getBuffer();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.getBuffer();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getBufferOrFail", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getBufferOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.getBufferOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getArrayBuffer", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getArrayBuffer();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.getArrayBuffer();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getArrayBufferOrFail", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getArrayBufferOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.getArrayBufferOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getReadable", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getReadable();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.getReadable();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getReadableOrFail", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getReadableOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.getReadableOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getReadableStream", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getReadableStream();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.getReadableStream();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getReadableStreamOrFail", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getReadableStreamOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.getReadableStreamOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getMetadata", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getMetadata();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.getMetadata();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: getMetadataOrFail", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.getMetadataOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.getMetadataOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: exists", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.exists();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.exists();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: missing", () => {
                test("Should distpatch FoundFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: FoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.FOUND,
                        listener,
                    );

                    await file.missing();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.FOUND,
                        } satisfies EventWithType<
                            FoundFileEvent,
                            typeof FILE_EVENTS.FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.missing();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: add", () => {
                test("Should distpatch KeyExistsFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: KeyExistsFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.KEY_EXISTS,
                        listener,
                    );

                    await file.add({
                        data: new Uint8Array(
                            Buffer.from("NEW_CONTENT", "utf8"),
                        ),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.KEY_EXISTS,
                        } satisfies EventWithType<
                            KeyExistsFileEvent,
                            typeof FILE_EVENTS.KEY_EXISTS
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch AddedFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: AddedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.ADDED,
                        listener,
                    );

                    await file.add({
                        data: new Uint8Array(
                            Buffer.from("NEW_CONTENT", "utf8"),
                        ),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.ADDED,
                        } satisfies EventWithType<
                            AddedFileEvent,
                            typeof FILE_EVENTS.ADDED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: addOrFail", () => {
                test("Should distpatch KeyExistsFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: KeyExistsFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.KEY_EXISTS,
                        listener,
                    );

                    try {
                        await file.addOrFail({
                            data: new Uint8Array(
                                Buffer.from("NEW_CONTENT", "utf8"),
                            ),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.KEY_EXISTS,
                        } satisfies EventWithType<
                            KeyExistsFileEvent,
                            typeof FILE_EVENTS.KEY_EXISTS
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch AddedFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: AddedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.ADDED,
                        listener,
                    );

                    await file.addOrFail({
                        data: new Uint8Array(
                            Buffer.from("NEW_CONTENT", "utf8"),
                        ),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.ADDED,
                        } satisfies EventWithType<
                            AddedFileEvent,
                            typeof FILE_EVENTS.ADDED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: addStream", () => {
                test("Should distpatch KeyExistsFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: KeyExistsFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.KEY_EXISTS,
                        listener,
                    );

                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("NEW_CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.KEY_EXISTS,
                        } satisfies EventWithType<
                            KeyExistsFileEvent,
                            typeof FILE_EVENTS.KEY_EXISTS
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch AddedFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: AddedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.ADDED,
                        listener,
                    );

                    await file.addStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("NEW_CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.ADDED,
                        } satisfies EventWithType<
                            AddedFileEvent,
                            typeof FILE_EVENTS.ADDED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: addStreamOrFail", () => {
                test("Should distpatch KeyExistsFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: KeyExistsFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.KEY_EXISTS,
                        listener,
                    );

                    try {
                        await file.addStreamOrFail({
                            data: {
                                async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                    yield Promise.resolve(
                                        new Uint8Array(
                                            Buffer.from("NEW_CONTENT", "utf8"),
                                        ),
                                    );
                                },
                            },
                        });
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.KEY_EXISTS,
                        } satisfies EventWithType<
                            KeyExistsFileEvent,
                            typeof FILE_EVENTS.KEY_EXISTS
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch AddedFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: AddedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.ADDED,
                        listener,
                    );

                    await file.addStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("NEW_CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.ADDED,
                        } satisfies EventWithType<
                            AddedFileEvent,
                            typeof FILE_EVENTS.ADDED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: update", () => {
                test("Should distpatch UpdatedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: UpdatedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.UPDATED,
                        listener,
                    );

                    await file.update({
                        data: new Uint8Array(
                            Buffer.from("NEW_CONTENT", "utf8"),
                        ),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.UPDATED,
                        } satisfies EventWithType<
                            UpdatedFileEvent,
                            typeof FILE_EVENTS.UPDATED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.update({
                        data: new Uint8Array(
                            Buffer.from("NEW_CONTENT", "utf8"),
                        ),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: updateOrFail", () => {
                test("Should distpatch UpdatedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: UpdatedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.UPDATED,
                        listener,
                    );

                    await file.updateOrFail({
                        data: new Uint8Array(
                            Buffer.from("NEW_CONTENT", "utf8"),
                        ),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.UPDATED,
                        } satisfies EventWithType<
                            UpdatedFileEvent,
                            typeof FILE_EVENTS.UPDATED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.updateOrFail({
                            data: new Uint8Array(
                                Buffer.from("NEW_CONTENT", "utf8"),
                            ),
                        });
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: updateStream", () => {
                test("Should distpatch UpdatedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: UpdatedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.UPDATED,
                        listener,
                    );

                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("NEW_CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.UPDATED,
                        } satisfies EventWithType<
                            UpdatedFileEvent,
                            typeof FILE_EVENTS.UPDATED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.updateStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("NEW_CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: updateStreamOrFail", () => {
                test("Should distpatch UpdatedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: UpdatedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.UPDATED,
                        listener,
                    );

                    await file.updateStreamOrFail({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("NEW_CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.UPDATED,
                        } satisfies EventWithType<
                            UpdatedFileEvent,
                            typeof FILE_EVENTS.UPDATED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.updateStreamOrFail({
                            data: {
                                async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                    yield Promise.resolve(
                                        new Uint8Array(
                                            Buffer.from("NEW_CONTENT", "utf8"),
                                        ),
                                    );
                                },
                            },
                        });
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: put", () => {
                test("Should distpatch UpdatedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: UpdatedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.UPDATED,
                        listener,
                    );

                    await file.put({
                        data: new Uint8Array(
                            Buffer.from("NEW_CONTENT", "utf8"),
                        ),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.UPDATED,
                        } satisfies EventWithType<
                            UpdatedFileEvent,
                            typeof FILE_EVENTS.UPDATED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch AddedFileEvent when key doesnt exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: AddedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.ADDED,
                        listener,
                    );

                    await file.put({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.ADDED,
                        } satisfies EventWithType<
                            AddedFileEvent,
                            typeof FILE_EVENTS.ADDED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: putStream", () => {
                test("Should distpatch UpdatedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: UpdatedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.UPDATED,
                        listener,
                    );

                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("NEW_CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.UPDATED,
                        } satisfies EventWithType<
                            UpdatedFileEvent,
                            typeof FILE_EVENTS.UPDATED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch AddedFileEvent when key doesnt exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: AddedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.ADDED,
                        listener,
                    );

                    await file.putStream({
                        data: {
                            async *[Symbol.asyncIterator](): AsyncIterator<FileContent> {
                                yield Promise.resolve(
                                    new Uint8Array(
                                        Buffer.from("CONTENT", "utf8"),
                                    ),
                                );
                            },
                        },
                    });

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.ADDED,
                        } satisfies EventWithType<
                            AddedFileEvent,
                            typeof FILE_EVENTS.ADDED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: remove", () => {
                test("Should distpatch RemovedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: RemovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.REMOVED,
                        listener,
                    );

                    await file.remove();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.REMOVED,
                        } satisfies EventWithType<
                            RemovedFileEvent,
                            typeof FILE_EVENTS.REMOVED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    await file.remove();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: removeOrFail", () => {
                test("Should distpatch RemovedFileEvent when key exists", async () => {
                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                    });

                    const listener = vi.fn((_even: RemovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.REMOVED,
                        listener,
                    );

                    await file.removeOrFail();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.REMOVED,
                        } satisfies EventWithType<
                            RemovedFileEvent,
                            typeof FILE_EVENTS.REMOVED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should distpatch NotFoundFileEvent when key does not exists", async () => {
                    const file = fileStorage.create("a");

                    const listener = vi.fn((_even: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );

                    try {
                        await file.removeOrFail();
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: copy", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    await fileStorage.create("a").copy("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch DestinationExistsFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn(
                        (_event: DestinationExistsFileEvent) => {},
                    );
                    await fileStorage.events.addListener(
                        FILE_EVENTS.DESTINATION_EXISTS,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    await file.copy("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            type: FILE_EVENTS.DESTINATION_EXISTS,
                        } satisfies EventWithType<
                            DestinationExistsFileEvent,
                            typeof FILE_EVENTS.DESTINATION_EXISTS
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch CopiedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: CopiedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.COPIED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.copy("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: false,
                            type: FILE_EVENTS.COPIED,
                        } satisfies EventWithType<
                            CopiedFileEvent,
                            typeof FILE_EVENTS.COPIED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: copyOrFail", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    try {
                        await fileStorage.create("a").copyOrFail("b");
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch DestinationExistsFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn(
                        (_event: DestinationExistsFileEvent) => {},
                    );
                    await fileStorage.events.addListener(
                        FILE_EVENTS.DESTINATION_EXISTS,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    try {
                        await file.copyOrFail("b");
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            type: FILE_EVENTS.DESTINATION_EXISTS,
                        } satisfies EventWithType<
                            DestinationExistsFileEvent,
                            typeof FILE_EVENTS.DESTINATION_EXISTS
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch CopiedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: CopiedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.COPIED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.copyOrFail("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: false,
                            type: FILE_EVENTS.COPIED,
                        } satisfies EventWithType<
                            CopiedFileEvent,
                            typeof FILE_EVENTS.COPIED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: copyAndReplace", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    await fileStorage.create("a").copyAndReplace("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch CopiedFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn((_event: CopiedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.COPIED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    await file.copyAndReplace("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.COPIED,
                        } satisfies EventWithType<
                            CopiedFileEvent,
                            typeof FILE_EVENTS.COPIED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch CopiedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: CopiedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.COPIED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.copyAndReplace("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.COPIED,
                        } satisfies EventWithType<
                            CopiedFileEvent,
                            typeof FILE_EVENTS.COPIED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: copyAndReplaceOrFail", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    try {
                        await fileStorage.create("a").copyAndReplaceOrFail("b");
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch CopiedFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn((_event: CopiedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.COPIED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    await file.copyAndReplaceOrFail("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.COPIED,
                        } satisfies EventWithType<
                            CopiedFileEvent,
                            typeof FILE_EVENTS.COPIED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch CopiedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: CopiedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.COPIED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.copyAndReplaceOrFail("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.COPIED,
                        } satisfies EventWithType<
                            CopiedFileEvent,
                            typeof FILE_EVENTS.COPIED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: move", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    await fileStorage.create("a").move("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch DestinationExistsFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn(
                        (_event: DestinationExistsFileEvent) => {},
                    );
                    await fileStorage.events.addListener(
                        FILE_EVENTS.DESTINATION_EXISTS,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    await file.move("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            type: FILE_EVENTS.DESTINATION_EXISTS,
                        } satisfies EventWithType<
                            DestinationExistsFileEvent,
                            typeof FILE_EVENTS.DESTINATION_EXISTS
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch MovedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: MovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.MOVED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.move("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: false,
                            type: FILE_EVENTS.MOVED,
                        } satisfies EventWithType<
                            MovedFileEvent,
                            typeof FILE_EVENTS.MOVED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: moveOrFail", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    try {
                        await fileStorage.create("a").moveOrFail("b");
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch DestinationExistsFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn(
                        (_event: DestinationExistsFileEvent) => {},
                    );
                    await fileStorage.events.addListener(
                        FILE_EVENTS.DESTINATION_EXISTS,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    try {
                        await file.moveOrFail("b");
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            type: FILE_EVENTS.DESTINATION_EXISTS,
                        } satisfies EventWithType<
                            DestinationExistsFileEvent,
                            typeof FILE_EVENTS.DESTINATION_EXISTS
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch MovedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: MovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.MOVED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.moveOrFail("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: false,
                            type: FILE_EVENTS.MOVED,
                        } satisfies EventWithType<
                            MovedFileEvent,
                            typeof FILE_EVENTS.MOVED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: moveAndReplace", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    await fileStorage.create("a").moveAndReplace("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch MovedFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn((_event: MovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.MOVED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    await file.moveAndReplace("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.MOVED,
                        } satisfies EventWithType<
                            MovedFileEvent,
                            typeof FILE_EVENTS.MOVED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch MovedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: MovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.MOVED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.moveAndReplace("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.MOVED,
                        } satisfies EventWithType<
                            MovedFileEvent,
                            typeof FILE_EVENTS.MOVED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: moveAndReplaceOrFail", () => {
                test("Should dispatch NotFoundFileEvent when source doesnt exists", async () => {
                    const listener = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listener,
                    );
                    try {
                        await fileStorage.create("a").moveAndReplaceOrFail("b");
                    } catch {
                        /* EMPTY */
                    }

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);
                    }, waitForSettings);
                });
                test("Should dispatch MovedFileEvent when source exists and destination exists", async () => {
                    const listener = vi.fn((_event: MovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.MOVED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    await file.moveAndReplaceOrFail("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.MOVED,
                        } satisfies EventWithType<
                            MovedFileEvent,
                            typeof FILE_EVENTS.MOVED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
                test("Should dispatch MovedFileEvent when source exists and destination doesnt exists", async () => {
                    const listener = vi.fn((_event: MovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.MOVED,
                        listener,
                    );

                    const file = fileStorage.create("a");
                    await file.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await file.moveAndReplaceOrFail("b");

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            source: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            destination: expect.objectContaining({
                                get: expect.any(Function) as IKey["get"],
                                toString: expect.any(
                                    Function,
                                ) as IKey["toString"],
                                equals: expect.any(Function) as IKey["equals"],
                            } satisfies IKey) as IKey,
                            replaced: true,
                            type: FILE_EVENTS.MOVED,
                        } satisfies EventWithType<
                            MovedFileEvent,
                            typeof FILE_EVENTS.MOVED
                        >);

                        const sourceKeyObj =
                            listener.mock.calls[0]?.[0].source.key;
                        expect(sourceKeyObj?.get()).toBe("a");
                        const destKeyObj =
                            listener.mock.calls[0]?.[0].destination;
                        expect(destKeyObj?.get()).toBe("b");
                    }, waitForSettings);
                });
            });
            describe("method: removeMany", () => {
                test("Should dispatch RemovedFileEvent when one key exists", async () => {
                    const listener = vi.fn((_event: RemovedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.REMOVED,
                        listener,
                    );

                    const file1 = fileStorage.create("a");
                    await file1.add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });

                    const file2 = fileStorage.create("b");
                    await file2.add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });

                    await fileStorage.removeMany([file1, file2]);

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledTimes(2);
                        expect(listener).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.REMOVED,
                        } satisfies EventWithType<
                            RemovedFileEvent,
                            typeof FILE_EVENTS.REMOVED
                        >);

                        const keyObj = listener.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
                test("Should dispatch NotFoundFileEvent when all keys doesnt exists", async () => {
                    const listeners = vi.fn((_event: NotFoundFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.NOT_FOUND,
                        listeners,
                    );

                    const file1 = fileStorage.create("a");
                    const file2 = fileStorage.create("b");
                    await fileStorage.removeMany([file1, file2]);

                    await vi.waitFor(() => {
                        expect(listeners).toHaveBeenCalledTimes(2);
                        expect(listeners).toHaveBeenCalledWith({
                            file: expect.objectContaining({
                                key: expect.objectContaining({
                                    get: expect.any(Function) as IKey["get"],
                                    toString: expect.any(
                                        Function,
                                    ) as IKey["toString"],
                                    equals: expect.any(
                                        Function,
                                    ) as IKey["equals"],
                                } satisfies IKey) as IKey,
                            }) as IReadableFile,
                            type: FILE_EVENTS.NOT_FOUND,
                        } satisfies EventWithType<
                            NotFoundFileEvent,
                            typeof FILE_EVENTS.NOT_FOUND
                        >);

                        const keyObj = listeners.mock.calls[0]?.[0].file.key;
                        expect(keyObj?.get()).toBe("a");
                    }, waitForSettings);
                });
            });
            describe("method: clear", () => {
                test("Should ClearedFileEvent when clear method is called", async () => {
                    const listener = vi.fn((_event: ClearedFileEvent) => {});
                    await fileStorage.events.addListener(
                        FILE_EVENTS.CLEARED,
                        listener,
                    );

                    await fileStorage.create("a").add({
                        data: new Uint8Array(Buffer.from("CONTENT_A", "utf8")),
                    });
                    await fileStorage.create("b").add({
                        data: new Uint8Array(Buffer.from("CONTENT_B", "utf8")),
                    });
                    await fileStorage.create("c").add({
                        data: new Uint8Array(Buffer.from("CONTENT_C", "utf8")),
                    });
                    await fileStorage.clear();

                    await vi.waitFor(() => {
                        expect(listener).toHaveBeenCalledOnce();
                        expect(listener).toHaveBeenCalledWith({
                            type: FILE_EVENTS.CLEARED,
                        });
                    }, waitForSettings);
                });
            });
        });
        describe.skipIf(excludeSerdeTests)("Serde tests:", () => {
            test("Should allow get data from a deserialized file instance", async () => {
                const file = fileStorage.create("a.txt");
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await file.add({ data });
                const deserializedFile = serde.deserialize<IFile>(
                    serde.serialize(file),
                );

                const retrievedData = await deserializedFile.getBytes();

                expect(retrievedData).toEqual(data);
            });
            test("Should allow update data on a deserialized file instance", async () => {
                const file = fileStorage.create("a.txt");
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await file.add({ data });
                const deserializedFile = serde.deserialize<IFile>(
                    serde.serialize(file),
                );

                const newData = new Uint8Array(
                    Buffer.from("NEW_CONTENT", "utf8"),
                );
                await deserializedFile.update({
                    data: newData,
                });
                const retrievedData = await deserializedFile.getBytes();

                expect(retrievedData).toEqual(newData);
            });
            test("Should allow put data on a deserialized file instance", async () => {
                const file = fileStorage.create("a.txt");
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await file.add({ data });
                const deserializedFile = serde.deserialize<IFile>(
                    serde.serialize(file),
                );

                const newData = new Uint8Array(
                    Buffer.from("NEW_CONTENT", "utf8"),
                );
                await deserializedFile.put({
                    data: newData,
                });
                const retrievedData = await deserializedFile.getBytes();

                expect(retrievedData).toEqual(newData);
            });
            test("Should allow remove data on a deserialized file instance", async () => {
                const file = fileStorage.create("a.txt");
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await file.add({ data });
                const deserializedFile = serde.deserialize<IFile>(
                    serde.serialize(file),
                );

                await deserializedFile.remove();
                const retrievedData = await deserializedFile.getBytes();

                expect(retrievedData).toBeNull();
            });
        });
    });
}

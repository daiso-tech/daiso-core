/**
 * @module FileStorage
 */

import {
    type beforeEach,
    type ExpectStatic,
    type SuiteAPI,
    type TestAPI,
} from "vitest";

import { type IReadableContext } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    FILE_WRITE_ENUM,
    type FileAdapterMetadata,
    type IFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import {
    isUint8ByteArrayEqualityTester,
    resolveStream,
} from "@/test-utilities/_module.js";
import { type Promisable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export type FileStorageAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IFileStorageAdapter>;
    /**
     * @default true
     */
    enableGetMetaData?: boolean;

    /**
     * @default
     * ```ts
     * import { ExecutionContext } from "@daiso-tech/core/execution-context"
     * import { NoOpExecutionContextAdapter } from "@daiso-tech/core/execution-context/no-op-execution-context-adapter"
     *
     * new ExecutionContext(new NoOpExecutionContextAdapter())
     * ```
     */
    context?: IReadableContext;
};

/**
 * The `fileStorageAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IFileStorageAdapter | `IFileStorageAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"@daiso-tech/core/file-storage/test-utilities"`
 * @group TestUtilities
 */
export function fileStorageAdapterTestSuite(
    settings: FileStorageAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach,
        enableGetMetaData = true,
        context = new ExecutionContext(new NoOpExecutionContextAdapter()),
    } = settings;
    let adapter: IFileStorageAdapter;
    beforeEach(async () => {
        adapter = await createAdapter();
    });

    describe("IFileStorageAdapter tests:", () => {
        expect.addEqualityTesters([isUint8ByteArrayEqualityTester]);

        describe("method: exists", () => {
            test("Should return false when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.exists(context, noneExistingKey);

                expect(result).toBe(false);
            });
            test("Should return true when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.exists(context, key);

                expect(result).toBe(true);
            });
        });
        describe("method: getStream", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getStream(
                    context,
                    noneExistingKey,
                );

                expect(result).toBeNull();
            });
            test("Should return AsyncIterable<Uint8Array> when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await resolveStream(
                    await adapter.getStream(context, key),
                );

                expect(result).toEqual(data);
            });
        });
        describe("method: getBytes", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getBytes(context, noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return Uint8Array when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getBytes(context, key);

                expect(result).toEqual(data);
            });
        });
        describe.skipIf(!enableGetMetaData)("method: getMetaData", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getMetaData(
                    context,
                    noneExistingKey,
                );

                expect(result).toBeNull();
            });
            test("Should return initial metadata with a null updatedAt after add method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return initial metadata with a null updatedAt after put method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after add method followed by update method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.update(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after put method followed by update method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.update(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after put overwrites an existing file", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.put(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return initial metadata with a null updatedAt after addStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return initial metadata with a null updatedAt after putStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after addStream method followed by updateStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.updateStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after putStream method followed by updateStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.updateStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after putStream overwrites an existing file", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(context, key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
        });
        describe("method: add", () => {
            test("Should return true when key does not exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(true);
            });
            test("Should return false when key exists", async () => {
                const key = "a";

                const contentType = "application/octet-stream";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(
                    Buffer.from("NEW_CONTENT", "utf8"),
                );
                const result = await adapter.add(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(false);
            });
            test("Should persist data when key does not exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(data);
            });
            test("Should not persist data when key exists", async () => {
                const key = "a";

                const contentType = "application/octet-stream";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(
                    Buffer.from("NEW_CONTENT", "utf8"),
                );
                await adapter.add(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(data);
            });
        });
        describe("method: addStream", () => {
            test("Should return true when key does not exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(true);
            });
            test("Should return false when key exists", async () => {
                const key = "a";

                const contentType = "application/octet-stream";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(
                    Buffer.from("NEW_CONTENT", "utf8"),
                );
                const result = await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(false);
            });
            test("Should persist data when key does not exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(data);
            });
            test("Should not persist data when key exists", async () => {
                const key = "a";

                const contentType = "application/octet-stream";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(
                    Buffer.from("NEW_CONTENT", "utf8"),
                );
                await adapter.addStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(data);
            });
        });
        describe("method: update", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.update(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(false);
            });
            test("Should not persist data when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.update(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toBeNull();
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.update(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(true);
            });
            test("Should persist data when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.update(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: updateStream", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.updateStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(false);
            });
            test("Should not persist data when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.updateStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toBeNull();
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.updateStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(true);
            });
            test("Should persist data when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.updateStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: put", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.put(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(false);
            });
            test("Should persist data when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(data);
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.put(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(true);
            });
            test("Should persist data when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.put(context, key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: putStream", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(false);
            });
            test("Should persist data when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(data);
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                expect(result).toBe(true);
            });
            test("Should persist data when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.putStream(context, key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(context, key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: copy", () => {
            test("Should return FILE_WRITE_ENUM.NOT_FOUND when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.copy(
                    context,
                    noneExistingSource,
                    noneExistingDestination,
                );

                expect(result).toBe(FILE_WRITE_ENUM.NOT_FOUND);
            });
            test("Should return FILE_WRITE_ENUM.NOT_FOUND when source does not exists and destination exists", async () => {
                const noneExistingSource = "a";

                const destination = "c";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.copy(
                    context,
                    noneExistingSource,
                    destination,
                );

                expect(result).toBe(FILE_WRITE_ENUM.NOT_FOUND);
            });
            test("Should return FILE_WRITE_ENUM.KEY_EXISTS when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.copy(context, source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.KEY_EXISTS);
            });
            test("Should not persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.copy(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(destinationData);
            });
            test("Should return FILE_WRITE_ENUM.SUCCESS when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.copy(context, source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.SUCCESS);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.copy(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(sourceData);
            });
        });
        describe("method: copyAndReplace", () => {
            test("Should return false when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.copyAndReplace(
                    context,
                    noneExistingSource,
                    noneExistingDestination,
                );

                expect(result).toBe(false);
            });
            test("Should return false when source does not exists and destination exists", async () => {
                const noneExistingSource = "a";

                const destination = "c";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.copyAndReplace(
                    context,
                    noneExistingSource,
                    destination,
                );

                expect(result).toBe(false);
            });
            test("Should return true when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.copyAndReplace(
                    context,
                    source,
                    destination,
                );

                expect(result).toBe(true);
            });
            test("Should persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.copyAndReplace(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(sourceData);
            });
            test("Should return true when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.copyAndReplace(
                    context,
                    source,
                    destination,
                );

                expect(result).toBe(true);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.copyAndReplace(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(sourceData);
            });
        });
        describe("method: move", () => {
            test("Should return FILE_WRITE_ENUM.NOT_FOUND when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.move(
                    context,
                    noneExistingSource,
                    noneExistingDestination,
                );

                expect(result).toBe(FILE_WRITE_ENUM.NOT_FOUND);
            });
            test("Should return FILE_WRITE_ENUM.NOT_FOUND when source does not exists and destination exists", async () => {
                const noneExistingSource = "a";

                const destination = "c";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.move(
                    context,
                    noneExistingSource,
                    destination,
                );

                expect(result).toBe(FILE_WRITE_ENUM.NOT_FOUND);
            });
            test("Should return FILE_WRITE_ENUM.KEY_EXISTS when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.move(context, source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.KEY_EXISTS);
            });
            test("Should not persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.move(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(destinationData);
            });
            test("Should return FILE_WRITE_ENUM.SUCCESS when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.move(context, source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.SUCCESS);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.move(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.move(context, source, destination);

                const result = await adapter.getBytes(context, source);
                expect(result).toBeNull();
            });
        });
        describe("method: moveAndReplace", () => {
            test("Should return false when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.moveAndReplace(
                    context,
                    noneExistingSource,
                    noneExistingDestination,
                );

                expect(result).toBe(false);
            });
            test("Should return false when source does not exists and destination exists", async () => {
                const noneExistingSource = "a";

                const destination = "c";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.moveAndReplace(
                    context,
                    noneExistingSource,
                    destination,
                );

                expect(result).toBe(false);
            });
            test("Should return true when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.moveAndReplace(
                    context,
                    source,
                    destination,
                );

                expect(result).toBe(true);
            });
            test("Should persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.moveAndReplace(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.add(context, destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.moveAndReplace(context, source, destination);

                const result = await adapter.getBytes(context, source);
                expect(result).toBeNull();
            });
            test("Should return true when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.moveAndReplace(
                    context,
                    source,
                    destination,
                );

                expect(result).toBe(true);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.moveAndReplace(context, source, destination);

                const result = await adapter.getBytes(context, destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(context, source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.moveAndReplace(context, source, destination);

                const result = await adapter.getBytes(context, source);
                expect(result).toBeNull();
            });
        });
        describe("method: removeMany", () => {
            test("Should return false when all keys does not exists", async () => {
                const result = await adapter.removeMany(context, [
                    "a",
                    "b",
                    "c",
                ]);

                expect(result).toBe(false);
            });
            test("Should return true when one key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.removeMany(context, [
                    key,
                    "b",
                    "c",
                ]);

                expect(result).toBe(true);
            });
            test("Should persist removal of the keys that exists", async () => {
                const data1 = new Uint8Array(Buffer.from("CONTENT_A", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, "a", {
                    data: data1,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data1.length,
                });

                const data2 = new Uint8Array(Buffer.from("CONTENT_B", "utf8"));
                await adapter.add(context, "b", {
                    data: data2,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data2.length,
                });

                const data3 = new Uint8Array(Buffer.from("CONTENT_C", "utf8"));
                await adapter.add(context, "c", {
                    data: data3,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data3.length,
                });

                await adapter.removeMany(context, ["a", "b"]);

                const result = [
                    await adapter.getBytes(context, "a"),
                    await adapter.getBytes(context, "b"),
                    await adapter.getBytes(context, "c"),
                ];
                expect(result).toEqual([null, null, data3]);
            });
        });
        describe("method: removeByPrefix", () => {
            test(`Should remove all keys that start with prefix "file-storage"`, async () => {
                const dataA = new Uint8Array(Buffer.from("CONTENT_A", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(context, "cache/a", {
                    data: dataA,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataA.length,
                });

                const dataB = new Uint8Array(Buffer.from("CONTENT_B", "utf8"));
                await adapter.add(context, "cache/b", {
                    data: dataB,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataB.length,
                });

                const dataC = new Uint8Array(Buffer.from("CONTENT_C", "utf8"));
                await adapter.add(context, "c", {
                    data: dataC,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataC.length,
                });

                await adapter.removeByPrefix(context, "cache");

                const result = [
                    await adapter.getBytes(context, "cache/a"),
                    await adapter.getBytes(context, "cache/b"),
                    await adapter.getBytes(context, "c"),
                ];
                expect(result).toEqual([null, null, dataC]);
            });
        });
    });
}

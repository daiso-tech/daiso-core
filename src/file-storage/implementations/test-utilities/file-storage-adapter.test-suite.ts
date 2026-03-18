/**
 * @module FileStorage
 */

import {
    type beforeEach,
    type ExpectStatic,
    type SuiteAPI,
    type TestAPI,
} from "vitest";

import {
    FILE_WRITE_ENUM,
    type FileAdapterMetadata,
    type IFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
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
};

async function resolveStream(
    stream: AsyncIterable<Uint8Array> | null,
): Promise<Uint8Array | null> {
    if (!stream) {
        return null;
    }

    const chunks: Array<Uint8Array> = [];
    let totalLength = 0;

    // 1. Collect all chunks and track the total byte length
    for await (const chunk of stream) {
        chunks.push(chunk);
        totalLength += chunk.byteLength;
    }

    // Handle empty streams
    if (chunks.length === 0) {
        return new Uint8Array(0);
    }

    // 2. Optimization: If there's only one chunk, just return it
    if (chunks.length === 1) {
        const chunk = chunks[0];
        if (chunk === undefined) {
            return null;
        }
        return chunk;
    }

    // 3. Allocate the final memory once
    const result = new Uint8Array(totalLength);
    let offset = 0;

    // 4. Copy each chunk into the final array
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return result;
}
function isUint8ByteArrayEqualityTester(
    a: unknown,
    b: unknown,
): boolean | undefined {
    if (!(a instanceof Uint8Array)) {
        return;
    }

    if (!(b instanceof Uint8Array)) {
        return;
    }

    return Buffer.from(a).equals(b);
}

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

                const result = await adapter.exists(noneExistingKey);

                expect(result).toBe(false);
            });
            test("Should return true when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.exists(key);

                expect(result).toBe(true);
            });
        });
        describe("method: getStream", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getStream(noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return AsyncIterable<Uint8Array> when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await resolveStream(
                    await adapter.getStream(key),
                );

                expect(result).toEqual(data);
            });
        });
        describe("method: getBytes", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getBytes(noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return Uint8Array when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getBytes(key);

                expect(result).toEqual(data);
            });
        });
        describe.skipIf(!enableGetMetaData)("method: getMetaData", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getMetaData(noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return initial metadata with a null updatedAt after add method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(key);

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
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(key);

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
                await adapter.add(key, {
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
                await adapter.update(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

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
                await adapter.put(key, {
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
                await adapter.update(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

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
                await adapter.put(key, {
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
                await adapter.put(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

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
                await adapter.addStream(key, {
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
                const result = await adapter.getMetaData(key);

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
                await adapter.putStream(key, {
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
                const result = await adapter.getMetaData(key);

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
                await adapter.addStream(key, {
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
                await adapter.updateStream(key, {
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
                const result = await adapter.getMetaData(key);

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
                await adapter.putStream(key, {
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
                await adapter.updateStream(key, {
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
                const result = await adapter.getMetaData(key);

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
                await adapter.putStream(key, {
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
                await adapter.putStream(key, {
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
                const result = await adapter.getMetaData(key);

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
                const result = await adapter.add(key, {
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
                await adapter.add(key, {
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
                const result = await adapter.add(key, {
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
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
            test("Should not persist data when key exists", async () => {
                const key = "a";

                const contentType = "application/octet-stream";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.add(key, {
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
                await adapter.add(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
        });
        describe("method: addStream", () => {
            test("Should return true when key does not exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.addStream(key, {
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
                await adapter.addStream(key, {
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
                const result = await adapter.addStream(key, {
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
                await adapter.addStream(key, {
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

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
            test("Should not persist data when key exists", async () => {
                const key = "a";

                const contentType = "application/octet-stream";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.addStream(key, {
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
                await adapter.addStream(key, {
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

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
        });
        describe("method: update", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.update(key, {
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
                await adapter.update(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toBeNull();
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.update(key, {
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
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.update(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: updateStream", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.updateStream(key, {
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
                await adapter.updateStream(key, {
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

                const result = await adapter.getBytes(key);
                expect(result).toBeNull();
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.updateStream(key, {
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
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.updateStream(key, {
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

                const result = await adapter.getBytes(key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: put", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.put(key, {
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
                await adapter.put(key, {
                    data: data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.put(key, {
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
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.put(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: putStream", () => {
            test("Should return false when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                const result = await adapter.putStream(key, {
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
                await adapter.putStream(key, {
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

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
            test("Should return true when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const result = await adapter.putStream(key, {
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
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.putStream(key, {
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

                const result = await adapter.getBytes(key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: copy", () => {
            test("Should return FILE_WRITE_ENUM.NOT_FOUND when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.copy(
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
                await adapter.add(destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.copy(
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
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.copy(source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.KEY_EXISTS);
            });
            test("Should not persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.copy(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(destinationData);
            });
            test("Should return FILE_WRITE_ENUM.SUCCESS when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.copy(source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.SUCCESS);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.copy(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
        });
        describe("method: copyAndReplace", () => {
            test("Should return false when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.copyAndReplace(
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
                await adapter.add(destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.copyAndReplace(
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
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.copyAndReplace(
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
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.copyAndReplace(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
            test("Should return true when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
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
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.copyAndReplace(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
        });
        describe("method: move", () => {
            test("Should return FILE_WRITE_ENUM.NOT_FOUND when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.move(
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
                await adapter.add(destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.move(
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
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.move(source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.KEY_EXISTS);
            });
            test("Should not persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.move(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(destinationData);
            });
            test("Should return FILE_WRITE_ENUM.SUCCESS when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.move(source, destination);

                expect(result).toBe(FILE_WRITE_ENUM.SUCCESS);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.move(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.move(source, destination);

                const result = await adapter.getBytes(source);
                expect(result).toBeNull();
            });
        });
        describe("method: moveAndReplace", () => {
            test("Should return false when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.moveAndReplace(
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
                await adapter.add(destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.moveAndReplace(
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
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.moveAndReplace(
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
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.moveAndReplace(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
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
                await adapter.add(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.moveAndReplace(source, destination);

                const result = await adapter.getBytes(source);
                expect(result).toBeNull();
            });
            test("Should return true when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
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
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.moveAndReplace(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.add(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.moveAndReplace(source, destination);

                const result = await adapter.getBytes(source);
                expect(result).toBeNull();
            });
        });
        describe("method: removeMany", () => {
            test("Should return false when all keys does not exists", async () => {
                const result = await adapter.removeMany(["a", "b", "c"]);

                expect(result).toBe(false);
            });
            test("Should return true when one key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.removeMany([key, "b", "c"]);

                expect(result).toBe(true);
            });
            test("Should persist removal of the keys that exists", async () => {
                const data1 = new Uint8Array(Buffer.from("CONTENT_A", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add("a", {
                    data: data1,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data1.length,
                });

                const data2 = new Uint8Array(Buffer.from("CONTENT_B", "utf8"));
                await adapter.add("b", {
                    data: data2,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data2.length,
                });

                const data3 = new Uint8Array(Buffer.from("CONTENT_C", "utf8"));
                await adapter.add("c", {
                    data: data3,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data3.length,
                });

                await adapter.removeMany(["a", "b"]);

                const result = [
                    await adapter.getBytes("a"),
                    await adapter.getBytes("b"),
                    await adapter.getBytes("c"),
                ];
                expect(result).toEqual([null, null, data3]);
            });
        });
        describe("method: removeByPrefix", () => {
            test(`Should remove all keys that start with prefix "file-storage"`, async () => {
                const dataA = new Uint8Array(Buffer.from("CONTENT_A", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.add("cache/a", {
                    data: dataA,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataA.length,
                });

                const dataB = new Uint8Array(Buffer.from("CONTENT_B", "utf8"));
                await adapter.add("cache/b", {
                    data: dataB,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataB.length,
                });

                const dataC = new Uint8Array(Buffer.from("CONTENT_C", "utf8"));
                await adapter.add("c", {
                    data: dataC,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataC.length,
                });

                await adapter.removeByPrefix("cache");

                const result = [
                    await adapter.getBytes("cache/a"),
                    await adapter.getBytes("cache/b"),
                    await adapter.getBytes("c"),
                ];
                expect(result).toEqual([null, null, dataC]);
            });
        });
    });
}

import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageInferFileTypeOnRead } from "@/file-storage/implementations/plugins/with-file-storage-infer-file-type-on-read/with-file-storage-infer-file-type-on-read.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    FileAdapterMetadata,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";

function iterableOf(chunk: Uint8Array): AsyncIterable<Uint8Array> {
    return {
        [Symbol.asyncIterator]: () => {
            let yielded = false;
            return {
                next: () => {
                    if (yielded) {
                        return Promise.resolve({
                            done: true,
                            value: undefined as unknown as Uint8Array,
                        });
                    }
                    yielded = true;
                    return Promise.resolve({ done: false, value: chunk });
                },
            };
        },
    };
}

describe("function: withFileStorageInferFileTypeOnRead", () => {
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const metadata: FileAdapterMetadata = {
        etag: "etag-123",
        contentType: "application/json",
        fileSizeInBytes: 1024,
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const zipBytes = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00,
    ]);
    const unknownBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    describe("method: getMetaData", () => {
        test("Should infer the content type from the file content when the metadata content type is null", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue({ ...metadata, contentType: null });
            const streamSpy = vi
                .spyOn(adapter, "getStream")
                .mockResolvedValue(iterableOf(zipBytes));

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnRead(),
            );

            const result = await enhanced.getMetaData("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("myKey");
            expect(streamSpy).toHaveBeenCalledWith("myKey");
            expect(result).toEqual({
                ...metadata,
                contentType: "application/zip",
            });
        });
        test("Should fall back to application/octet-stream when the metadata content type is null and the file type is unknown", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue({ ...metadata, contentType: null });
            const streamSpy = vi
                .spyOn(adapter, "getStream")
                .mockResolvedValue(iterableOf(unknownBytes));

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnRead(),
            );

            const result = await enhanced.getMetaData("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("myKey");
            expect(streamSpy).toHaveBeenCalledWith("myKey");
            expect(result).toEqual({
                ...metadata,
                contentType: "application/octet-stream",
            });
        });
        test("Should keep the metadata content type when the stream is null", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue({ ...metadata, contentType: null });
            const streamSpy = vi
                .spyOn(adapter, "getStream")
                .mockResolvedValue(null);

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnRead(),
            );

            const result = await enhanced.getMetaData("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("myKey");
            expect(streamSpy).toHaveBeenCalledWith("myKey");
            expect(result).toEqual({ ...metadata, contentType: null });
        });
        test("Should not read the stream when the metadata content type is not null", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue(metadata);
            const streamSpy = vi
                .spyOn(adapter, "getStream")
                .mockResolvedValue(null);

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnRead(),
            );

            const result = await enhanced.getMetaData("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("myKey");
            expect(streamSpy).not.toHaveBeenCalled();
            expect(result).toEqual(metadata);
        });
        test("Should return null when the adapter returns null", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue(null);

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferFileTypeOnRead(),
            );

            const result = await enhanced.getMetaData("myKey");

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("myKey");
            expect(result).toBeNull();
        });
    });
});

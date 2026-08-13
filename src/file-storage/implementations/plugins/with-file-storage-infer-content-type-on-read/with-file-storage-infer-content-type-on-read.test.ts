import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpContext } from "@/execution-context/implementations/derivables/execution-context/no-op-context.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module.js";
import { withFileStorageInferContentTypeOnRead } from "@/file-storage/implementations/plugins/with-file-storage-infer-content-type-on-read/with-file-storage-infer-content-type-on-read.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/enhance-factory.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    FileAdapterMetadata,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";

describe("function: withFileStorageInferContentTypeOnRead", () => {
    const context = new NoOpContext();
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const metadata: FileAdapterMetadata = {
        etag: "etag-123",
        contentType: "application/json",
        fileSizeInBytes: 1024,
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });
    describe("method: getMetaData", () => {
        test("Should infer the content type from the file key extension", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue(metadata);

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnRead(),
            );

            const result = await enhanced.getMetaData(
                "folder/file.txt",
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("folder/file.txt", context);
            expect(result).toEqual({
                ...metadata,
                contentType: "text/plain",
            });
        });
        test("Should fall back to application/octet-stream when the extension is unknown", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue(metadata);

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnRead(),
            );

            const result = await enhanced.getMetaData(
                "folder/file.unknownExtension",
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("folder/file.unknownExtension", context);
            expect(result).toEqual({
                ...metadata,
                contentType: "application/octet-stream",
            });
        });
        test("Should fall back to application/octet-stream when the metadata content type is null and the extension is unknown", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue({ ...metadata, contentType: null });

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnRead(),
            );

            const result = await enhanced.getMetaData(
                "folder/file.unknownExtension",
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("folder/file.unknownExtension", context);
            expect(result).toEqual({
                ...metadata,
                contentType: "application/octet-stream",
            });
        });
        test("Should return null when the adapter returns null", async () => {
            const spy = vi
                .spyOn(adapter, "getMetaData")
                .mockResolvedValue(null);

            const enhanced = withPlugin(
                adapter,
                withFileStorageInferContentTypeOnRead(),
            );

            const result = await enhanced.getMetaData(
                "folder/file.txt",
                context,
            );

            expect(spy).toHaveBeenCalledExactlyOnceWith<
                Parameters<ISignedFileStorageAdapter["getMetaData"]>
            >("folder/file.txt", context);
            expect(result).toBeNull();
        });
    });
});

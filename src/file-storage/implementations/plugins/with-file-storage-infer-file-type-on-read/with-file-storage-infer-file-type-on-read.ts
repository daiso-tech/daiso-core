/**
 * @module FileStorage
 */

import { fileTypeFromStream } from "file-type";

import type { IFileStorageAdapter } from "@/file-storage/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that infers the content type from the actual file content
 * when reading file metadata.
 *
 * When the `getMetaData` method is called, the plugin opens the object and reads
 * a leading sample of its content (via `getStream`) to detect the type using
 * `file-type`. When a type is detected, the metadata's `contentType` is
 * overridden with the detected MIME type; otherwise the content type falls back
 * to `application/octet-stream`, the most generic MIME type. When the file does
 * not exist, the plugin passes `null` through.
 *
 * Note that this extra read is additional I/O on every `getMetaData` call. If
 * you only need the content type for files whose keys carry a well-known
 * extension, prefer the extension-based `withFileStorageInferContentTypeOnRead`
 * plugin, which inspects only the file key and performs no extra read.
 *
 * @returns A middleware plugin that wraps a file-storage adapter.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageInferFileTypeOnRead(): PluginFn<IFileStorageAdapter> {
    return (adapter, enhance) => {
        enhance(
            adapter,
            "getMetaData",
            async ({ args: [key, context], next }) => {
                const metadata = await next([key, context]);
                if (metadata === null) {
                    return null;
                }
                if (metadata.contentType !== null) {
                    return metadata;
                }
                const stream = await adapter.getStream(key, context);
                if (stream === null) {
                    return metadata;
                }
                const result = await fileTypeFromStream(
                    ReadableStream.from(stream),
                );
                if (result === undefined) {
                    return {
                        ...metadata,
                        contentType: "application/octet-stream",
                    };
                }
                return {
                    ...metadata,
                    contentType: result.mime,
                };
            },
        );
    };
}

/**
 * @module FileStorage
 */

import { lookup } from "mime-types";

import type { IFileStorageAdapter } from "@/file-storage/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that infers the content type from the file key extension
 * when reading file metadata.
 *
 * When the `getMetaData` method is called, the plugin resolves the `contentType`
 * from the file key extension (via MIME lookup) and overrides the metadata's
 * content type. A successful lookup overrides the content type with the
 * inferred MIME type; when the extension is unknown, the content type falls
 * back to `application/octet-stream`, the most generic MIME type. When the
 * underlying adapter returns `null` (the file does not exist), the plugin
 * passes `null` through.
 *
 * @returns A middleware plugin that wraps a file-storage adapter.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageInferContentTypeOnRead(): PluginFn<IFileStorageAdapter> {
    function inferContentType(key: string): string {
        const inferredContentType = lookup(key);
        if (typeof inferredContentType !== "string") {
            return "application/octet-stream";
        }
        return inferredContentType;
    }
    return (adapter, enhance) => {
        enhance(
            adapter,
            "getMetaData",
            async ({ args: [key, context], next }) => {
                const metadata = await next([key, context]);
                if (metadata === null) {
                    return null;
                }
                return {
                    ...metadata,
                    contentType: inferContentType(key),
                };
            },
        );
    };
}

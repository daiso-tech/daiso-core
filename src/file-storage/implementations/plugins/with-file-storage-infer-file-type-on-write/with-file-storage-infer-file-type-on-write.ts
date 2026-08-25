/**
 * @module FileStorage
 */

import { fileTypeFromBuffer, fileTypeStream } from "file-type";

import type { IFileStorageAdapter } from "@/file-storage/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that infers the content type from the actual file content
 * when writing files.
 *
 * For every supported write method, the `contentType` is resolved by detecting
 * the type of the provided data (via `file-type`). When a type is detected, the
 * provided content type is replaced with the detected MIME type; otherwise the
 * content type falls back to `application/octet-stream`, the most generic
 * MIME type. This includes `add`, `addStream`, `update`, `updateStream`,
 * `put`, and `putStream`.
 *
 * @returns A middleware plugin that wraps a file-storage adapter.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageInferFileTypeOnWrite(): PluginFn<IFileStorageAdapter> {
    async function inferContentTypeFromBuffer(
        data: Uint8Array,
    ): Promise<string> {
        const result = await fileTypeFromBuffer(data);
        if (result === undefined) {
            return "application/octet-stream";
        }
        return result.mime;
    }

    async function inferContentTypeFromStream(
        data: AsyncIterable<Uint8Array>,
    ): Promise<{
        contentType: string;
        data: AsyncIterable<Uint8Array>;
    }> {
        const stream = await fileTypeStream(ReadableStream.from(data));
        if (stream.fileType === undefined) {
            return {
                contentType: "application/octet-stream",
                data: stream,
            };
        }
        return {
            contentType: stream.fileType.mime,
            data: stream,
        };
    }

    return (adapter, enhance) => {
        enhance(
            adapter,
            "add",
            async ({ args: [key, { data, ...restContent }], next }) => {
                return next([
                    key,
                    {
                        data,
                        ...restContent,
                        contentType: await inferContentTypeFromBuffer(data),
                    },
                ]);
            },
        );
        enhance(
            adapter,
            "addStream",
            async ({ args: [key, { data, ...restContent }], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        ...(await inferContentTypeFromStream(data)),
                    },
                ]);
            },
        );
        enhance(
            adapter,
            "update",
            async ({ args: [key, { data, ...restContent }], next }) => {
                return next([
                    key,
                    {
                        data,
                        ...restContent,
                        contentType: await inferContentTypeFromBuffer(data),
                    },
                ]);
            },
        );
        enhance(
            adapter,
            "updateStream",
            async ({ args: [key, { data, ...restContent }], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        ...(await inferContentTypeFromStream(data)),
                    },
                ]);
            },
        );
        enhance(
            adapter,
            "put",
            async ({ args: [key, { data, ...restContent }], next }) => {
                return next([
                    key,
                    {
                        data,
                        ...restContent,
                        contentType: await inferContentTypeFromBuffer(data),
                    },
                ]);
            },
        );
        enhance(
            adapter,
            "putStream",
            async ({ args: [key, { data, ...restContent }], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        ...(await inferContentTypeFromStream(data)),
                    },
                ]);
            },
        );
    };
}

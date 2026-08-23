/**
 * @module FileStorage
 */

import { lookup } from "mime-types";

import type {
    IFileUrlAdapter,
    IFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Configuration for the {@link withFileStorageInferContentTypeOnWrite} plugin.
 * Allows disabling content type inference for the signed URL methods.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export type WithFileStorageInferContentTypeOnWriteSettings = {
    /**
     * Whether to infer the content type from the file key extension when
     * generating signed download URLs.
     * @default true
     */
    inferSignedDownloadUrl?: boolean;

    /**
     * Whether to infer the content type from the file key extension when
     * generating signed upload URLs.
     * @default true
     */
    inferSignedUploadUrl?: boolean;
};

/**
 * Creates a plugin that infers the content type from the file key extension
 * when writing files or generating signed URLs.
 *
 * For every supported method, the `contentType` is resolved from the file key
 * extension (via MIME lookup). A successful lookup always replaces the provided
 * content type, and when the extension is unknown the content type falls back to
 * `application/octet-stream`, the most generic MIME type. On the signed URL
 * methods, a `null` content type is kept as `null`. This includes signed URL
 * generation and all write operations. Content type inference for signed URL
 * generation can be disabled per method through
 * {@link WithFileStorageInferContentTypeOnWriteSettings | `WithFileStorageInferContentTypeOnWriteSettings`}.
 *
 * @param settings - Optional configuration for the plugin.
 * @returns A middleware plugin that wraps a file-storage adapter.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageInferContentTypeOnWrite(
    settings: WithFileStorageInferContentTypeOnWriteSettings = {},
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    const { inferSignedDownloadUrl = true, inferSignedUploadUrl = true } =
        settings;

    function inferContentType(key: string): string {
        const inferredContentType = lookup(key);
        if (typeof inferredContentType !== "string") {
            return "application/octet-stream";
        }
        return inferredContentType;
    }
    return (adapter, enhance) => {
        if (inferSignedDownloadUrl) {
            enhance(
                adapter,
                "getSignedDownloadUrl",
                ({
                    args: [key, { contentType, ...restSettings }, context],
                    next,
                }) => {
                    return next([
                        key,
                        {
                            contentType:
                                contentType === null
                                    ? null
                                    : inferContentType(key),
                            ...restSettings,
                        },
                        context,
                    ]);
                },
            );
        }
        if (inferSignedUploadUrl) {
            enhance(
                adapter,
                "getSignedUploadUrl",
                ({
                    args: [key, { contentType, ...restSettings }, context],
                    next,
                }) => {
                    return next([
                        key,
                        {
                            contentType:
                                contentType === null
                                    ? null
                                    : inferContentType(key),
                            ...restSettings,
                        },
                        context,
                    ]);
                },
            );
        }
        enhance(
            adapter,
            "add",
            ({ args: [key, { ...restContent }, context], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        contentType: inferContentType(key),
                    },
                    context,
                ]);
            },
        );
        enhance(
            adapter,
            "addStream",
            ({ args: [key, { ...restContent }, context], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        contentType: inferContentType(key),
                    },
                    context,
                ]);
            },
        );
        enhance(
            adapter,
            "update",
            ({ args: [key, { ...restContent }, context], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        contentType: inferContentType(key),
                    },
                    context,
                ]);
            },
        );
        enhance(
            adapter,
            "updateStream",
            ({ args: [key, { ...restContent }, context], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        contentType: inferContentType(key),
                    },
                    context,
                ]);
            },
        );
        enhance(
            adapter,
            "put",
            ({ args: [key, { ...restContent }, context], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        contentType: inferContentType(key),
                    },
                    context,
                ]);
            },
        );
        enhance(
            adapter,
            "putStream",
            ({ args: [key, { ...restContent }, context], next }) => {
                return next([
                    key,
                    {
                        ...restContent,
                        contentType: inferContentType(key),
                    },
                    context,
                ]);
            },
        );
    };
}

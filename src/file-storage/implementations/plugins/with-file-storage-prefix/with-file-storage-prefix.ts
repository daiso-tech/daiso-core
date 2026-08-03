/**
 * @module FileStorage
 */

import {
    type IFileUrlAdapter,
    type IFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that prefixes all file keys passed to a file-storage adapter.
 *
 * Every method that accepts a file key (identifier/path) will have the given
 * `prefix` prepended before the call is forwarded to the underlying adapter.
 * This includes public URL generation, signed URL generation, existence checks,
 * streaming, metadata, and all CRUD operations.
 *
 * @param prefix - The string to prepend to every file key.
 * @returns A middleware plugin that wraps a file-storage adapter.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStoragePrefix(
    prefix: string,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "getPublicUrl", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "getSignedDownloadUrl",
            ({ args: [key, ...rest], next }) => {
                return next([withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "getSignedUploadUrl",
            ({ args: [key, ...rest], next }) => {
                return next([withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "exists", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "getStream", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "getBytes", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "getMetaData", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "add", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "addStream", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "update", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "updateStream", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "put", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(adapter, "putStream", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "copy",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([withPrefix(srcKey), withPrefix(destKey), ...rest]);
            },
        );
        enhance(
            adapter,
            "copyAndReplace",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([withPrefix(srcKey), withPrefix(destKey), ...rest]);
            },
        );
        enhance(
            adapter,
            "move",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([withPrefix(srcKey), withPrefix(destKey), ...rest]);
            },
        );
        enhance(
            adapter,
            "moveAndReplace",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([withPrefix(srcKey), withPrefix(destKey), ...rest]);
            },
        );
        enhance(adapter, "removeMany", ({ args: [keys, ...rest], next }) => {
            return next([keys.map(withPrefix), ...rest]);
        });
        enhance(adapter, "removeByPrefix", ({ args: [key, ...rest], next }) => {
            return next([withPrefix(key), ...rest]);
        });
    };
}

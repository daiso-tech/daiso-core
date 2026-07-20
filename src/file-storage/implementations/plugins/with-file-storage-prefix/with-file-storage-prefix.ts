/**
 * @module FileStorage
 */

import {
    type IFileUrlAdapter,
    type IFileStorageAdapter,
} from "@/file-storage/contracts/file-storage-adapter.contract.js";
import { type PluginFn } from "@/middleware/contracts/_module.js";

/**
 * @group Plugins
 */
export function withFileStoragePrefix(
    prefix: string,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    function withPrefix(key: string): string {
        return prefix + key;
    }
    return (adapter, enhance) => {
        enhance(
            adapter,
            "getPublicUrl",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "getSignedDownloadUrl",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "getSignedUploadUrl",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "exists", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "getStream", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "getBytes", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "getMetaData", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
        enhance(adapter, "add", ({ args: [context, key, ...rest], next }) => {
            return next([context, withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "addStream",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "update",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "updateStream",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "put", ({ args: [context, key, ...rest], next }) => {
            return next([context, withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "putStream",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "copy", ({ args: [context, key, ...rest], next }) => {
            return next([context, withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "copyAndReplace",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "move", ({ args: [context, key, ...rest], next }) => {
            return next([context, withPrefix(key), ...rest]);
        });
        enhance(
            adapter,
            "moveAndReplace",
            ({ args: [context, key, ...rest], next }) => {
                return next([context, withPrefix(key), ...rest]);
            },
        );
        enhance(adapter, "removeMany", ({ args: [context, keys], next }) => {
            return next([context, keys.map(withPrefix)]);
        });
        enhance(adapter, "removeByPrefix", ({ args: [context, key], next }) => {
            return next([context, withPrefix(key)]);
        });
    };
}

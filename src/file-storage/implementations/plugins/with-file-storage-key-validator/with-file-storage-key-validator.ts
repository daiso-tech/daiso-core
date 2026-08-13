/**
 * @module FileStorage
 */

import { InvalidKeyFileError } from "@/file-storage/contracts/_module.js";
import { defaultKeyValidator } from "@/file-storage/implementations/plugins/with-file-storage-key-validator/default-key-validator.js";
import { callInvocable } from "@/utilities/_module.js";

import type {
    IFileUrlAdapter,
    IFileStorageAdapter,
} from "@/file-storage/contracts/_module.js";
import type { FileKeyValidator } from "@/file-storage/implementations/plugins/with-file-storage-key-validator/default-key-validator.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a plugin that validates every file key passed to a file-storage adapter.
 *
 * Every method that accepts a file key runs the key through the configured
 * {@link FileKeyValidator} before the call is forwarded to the underlying adapter.
 * When the validator returns an error message, an {@link InvalidKeyFileError} is
 * thrown and the adapter method is never invoked. This includes public URL
 * generation, signed URL generation, existence checks, streaming, metadata, and
 * all CRUD operations.
 *
 * @param keyValidator - The validator used to check each file key. Defaults to {@link defaultKeyValidator}.
 * @returns A middleware plugin that wraps a file-storage adapter.
 * @throws {InvalidKeyFileError} When any key fails validation.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageKeyValidator(
    keyValidator: FileKeyValidator = defaultKeyValidator,
): PluginFn<Partial<IFileUrlAdapter> & IFileStorageAdapter> {
    function handleKey(key: string): string {
        const validationMessage = callInvocable(keyValidator, key);
        if (validationMessage !== null) {
            throw InvalidKeyFileError.create(validationMessage);
        }
        return key;
    }
    return (adapter, enhance) => {
        enhance(adapter, "getPublicUrl", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(
            adapter,
            "getSignedDownloadUrl",
            ({ args: [key, ...rest], next }) => {
                return next([handleKey(key), ...rest]);
            },
        );
        enhance(
            adapter,
            "getSignedUploadUrl",
            ({ args: [key, ...rest], next }) => {
                return next([handleKey(key), ...rest]);
            },
        );
        enhance(adapter, "exists", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "getStream", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "getBytes", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "getMetaData", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "add", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "addStream", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "update", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "updateStream", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "put", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(adapter, "putStream", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
        enhance(
            adapter,
            "copy",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([handleKey(srcKey), handleKey(destKey), ...rest]);
            },
        );
        enhance(
            adapter,
            "copyAndReplace",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([handleKey(srcKey), handleKey(destKey), ...rest]);
            },
        );
        enhance(
            adapter,
            "move",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([handleKey(srcKey), handleKey(destKey), ...rest]);
            },
        );
        enhance(
            adapter,
            "moveAndReplace",
            ({ args: [srcKey, destKey, ...rest], next }) => {
                return next([handleKey(srcKey), handleKey(destKey), ...rest]);
            },
        );
        enhance(adapter, "removeMany", ({ args: [keys, ...rest], next }) => {
            return next([keys.map(handleKey), ...rest]);
        });
        enhance(adapter, "removeByPrefix", ({ args: [key, ...rest], next }) => {
            return next([handleKey(key), ...rest]);
        });
    };
}
